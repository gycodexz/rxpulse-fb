import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  setDoc,
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  serverTimestamp,
  runTransaction
} from 'firebase/firestore';
import { db } from './firebase';

// Helper to normalize Firestore documents with _id & id
const formatDoc = (docSnap) => {
  if (!docSnap.exists()) return null;
  const data = docSnap.data();
  return { _id: docSnap.id, id: docSnap.id, ...data };
};

const formatDocs = (querySnap) => {
  return querySnap.docs.map(docSnap => ({
    _id: docSnap.id,
    id: docSnap.id,
    ...docSnap.data()
  }));
};

// Generic Collection Fetch
export const getCollection = async (collectionName, filters = []) => {
  try {
    const colRef = collection(db, collectionName);
    let q = query(colRef);
    if (filters.length > 0) {
      const constraints = filters.map(f => where(f.field, f.op || '==', f.value));
      q = query(colRef, ...constraints);
    }
    const snap = await getDocs(q);
    return formatDocs(snap);
  } catch (error) {
    console.error(`Error getting collection ${collectionName}:`, error);
    throw error;
  }
};

// Generic Document Add
export const addDocument = async (collectionName, data) => {
  try {
    const colRef = collection(db, collectionName);
    const docRef = await addDoc(colRef, {
      ...data,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    });
    return { _id: docRef.id, id: docRef.id, ...data };
  } catch (error) {
    console.error(`Error adding to ${collectionName}:`, error);
    throw error;
  }
};

// Generic Document Update
export const updateDocument = async (collectionName, id, data) => {
  try {
    const docRef = doc(db, collectionName, id);
    await updateDoc(docRef, {
      ...data,
      updated_at: serverTimestamp()
    });
    return { _id: id, id, ...data };
  } catch (error) {
    console.error(`Error updating ${collectionName}/${id}:`, error);
    throw error;
  }
};

// Generic Document Delete
export const deleteDocument = async (collectionName, id) => {
  try {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
    return { success: true, id };
  } catch (error) {
    console.error(`Error deleting ${collectionName}/${id}:`, error);
    throw error;
  }
};

// --- DRUGS & INVENTORY TRANSACTIONS ---

export const getDrugs = async () => getCollection('drugs');

export const createDrug = async (drugData) => {
  return addDocument('drugs', {
    ...drugData,
    quantity: Number(drugData.quantity || 0),
    reorder_level: Number(drugData.reorder_level || 10),
    unit_price: Number(drugData.unit_price || 0)
  });
};

export const getVendors = async () => getCollection('vendors');
export const getInstitutions = async () => getCollection('institutions');
export const getUsers = async () => getCollection('users');

// --- PURCHASE ORDERS ---

export const getPurchaseOrders = async (vendorIdFilter = null) => {
  if (vendorIdFilter) {
    return getCollection('purchase_orders', [{ field: 'vendor_id', op: '==', value: vendorIdFilter }]);
  }
  return getCollection('purchase_orders');
};

export const createPurchaseOrder = async (poData, currentUser) => {
  const newPo = {
    po_number: `PO-${Date.now().toString().slice(-6)}`,
    vendor_id: poData.vendor_id,
    vendor_name: poData.vendor_name || 'Vendor',
    status: 'pending', // pending -> approved -> shipped -> delivered
    items: poData.items || [],
    total_amount: Number(poData.total_amount || 0),
    created_by: currentUser?.email || 'System',
    notes: poData.notes || ''
  };
  return addDocument('purchase_orders', newPo);
};

export const updatePurchaseOrderStatus = async (poId, status) => {
  return updateDocument('purchase_orders', poId, { status });
};

// --- INVENTORY TRANSACTIONS ---

export const getInventoryTransactions = async () => getCollection('inventory');

export const recordInventoryTransaction = async (txData) => {
  return await runTransaction(db, async (transaction) => {
    const drugRef = doc(db, 'drugs', txData.drug_id);
    const drugSnap = await transaction.get(drugRef);
    
    if (!drugSnap.exists()) {
      throw new Error("Target Drug does not exist!");
    }
    
    const drug = drugSnap.data();
    const currentQty = Number(drug.quantity || 0);
    const changeQty = Number(txData.quantity || 0);
    let newQty = currentQty;

    if (txData.transaction_type === 'in') {
      newQty += changeQty;
    } else if (txData.transaction_type === 'out') {
      if (currentQty < changeQty) {
        throw new Error(`Insufficient stock for ${drug.name}! On hand: ${currentQty}`);
      }
      newQty -= changeQty;
    }

    // Update drug stock
    transaction.update(drugRef, { 
      quantity: newQty,
      updated_at: serverTimestamp() 
    });

    // Create Inventory Audit Record
    const newTxRef = doc(collection(db, 'inventory'));
    transaction.set(newTxRef, {
      drug_id: txData.drug_id,
      drug_name: drug.name,
      transaction_type: txData.transaction_type, // 'in' or 'out'
      quantity: changeQty,
      reference_no: txData.reference_no || 'MANUAL',
      notes: txData.notes || '',
      created_at: serverTimestamp()
    });

    return { success: true, newQuantity: newQty };
  });
};

// --- DISTRIBUTIONS ---

export const getDistributions = async () => getCollection('distributions');

export const createDistribution = async (distData) => {
  return await runTransaction(db, async (transaction) => {
    // 1. Check & Deduct Stock for each drug
    for (const item of distData.items) {
      const drugRef = doc(db, 'drugs', item.drug_id);
      const drugSnap = await transaction.get(drugRef);
      if (!drugSnap.exists()) throw new Error(`Drug ID ${item.drug_id} not found.`);
      
      const currentQty = Number(drugSnap.data().quantity || 0);
      const reqQty = Number(item.quantity || 0);
      if (currentQty < reqQty) {
        throw new Error(`Insufficient stock for ${drugSnap.data().name}. Required: ${reqQty}, Available: ${currentQty}`);
      }

      transaction.update(drugRef, {
        quantity: currentQty - reqQty,
        updated_at: serverTimestamp()
      });

      // Auto-log Inventory 'out'
      const invRef = doc(collection(db, 'inventory'));
      transaction.set(invRef, {
        drug_id: item.drug_id,
        drug_name: drugSnap.data().name,
        transaction_type: 'out',
        quantity: reqQty,
        reference_no: `DIST-${distData.institution_name || 'INST'}`,
        notes: `Dispatched to ${distData.institution_name || 'Hospital'}`,
        created_at: serverTimestamp()
      });
    }

    // 2. Add Distribution Record
    const distRef = doc(collection(db, 'distributions'));
    transaction.set(distRef, {
      institution_id: distData.institution_id,
      institution_name: distData.institution_name || 'Medical Institution',
      dispatch_date: distData.dispatch_date || new Date().toISOString().split('T')[0],
      items: distData.items,
      notes: distData.notes || '',
      status: 'Dispatched',
      created_at: serverTimestamp()
    });

    return { id: distRef.id };
  });
};

// --- DASHBOARD AGGREGATED METRICS ---

export const getDashboardStats = async () => {
  try {
    const [drugs, vendors, institutions, pos, inventory, distributions] = await Promise.all([
      getCollection('drugs'),
      getCollection('vendors'),
      getCollection('institutions'),
      getCollection('purchase_orders'),
      getCollection('inventory'),
      getCollection('distributions')
    ]);

    const lowStockDrugs = drugs.filter(d => Number(d.quantity) <= Number(d.reorder_level || 10));
    const pendingOrders = pos.filter(p => p.status === 'pending');

    return {
      total_drugs: drugs.length,
      total_vendors: vendors.length,
      total_institutions: institutions.length,
      pending_orders: pendingOrders.length,
      low_stock_count: lowStockDrugs.length,
      low_stock_drugs: lowStockDrugs,
      recent_orders: pos.slice(-5).reverse(),
      recent_distributions: distributions.slice(-5).reverse(),
      recent_transactions: inventory.slice(-5).reverse()
    };
  } catch (error) {
    console.error("Error generating dashboard stats:", error);
    return {
      total_drugs: 0,
      total_vendors: 0,
      total_institutions: 0,
      pending_orders: 0,
      low_stock_count: 0,
      low_stock_drugs: [],
      recent_orders: [],
      recent_distributions: [],
      recent_transactions: []
    };
  }
};
