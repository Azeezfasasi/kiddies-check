import Client from '../models/Client.js';
import { connectDB } from '../db/connect.js';

const DEFAULT_CLIENTS = {
  clients: [
    { name: 'Fieldbase Technical Services', logo: '/images/fieldbase.jpg', order: 0, active: true },
    { name: 'Huawei Technologies Limited', logo: '/images/huawei.png', order: 1, active: true },
    { name: 'MTN', logo: '/images/mtn.jpg', order: 2, active: true },
    { name: 'Airtel', logo: '/images/airtel.png', order: 3, active: true },
    { name: 'CIF Telecommunications Limited', logo: '/images/cif.png', order: 4, active: true },
    { name: 'Mainone', logo: '/images/mainone.jpg', order: 5, active: true },
    { name: 'IPNX', logo: '/images/ipnx.png', order: 6, active: true },
    { name: 'WIOCC', logo: '/images/wiocc.jpg', order: 7, active: true },
    { name: 'ntel', logo: '/images/ntel.png', order: 8, active: true },
  ],
};

export async function getClients() {
  try {
    await connectDB();

    let clientData = await Client.findOne();

    if (!clientData) {
      clientData = await Client.create(DEFAULT_CLIENTS);
    }

    return {
      success: true,
      clients: clientData.clients || [],
    };
  } catch (error) {
    console.error('Error fetching clients:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

export async function createClient(clientData) {
  try {
    await connectDB();

    let collection = await Client.findOne();
    if (!collection) {
      collection = await Client.create(DEFAULT_CLIENTS);
    }

    const newClient = {
      ...clientData,
      order: collection.clients.length,
    };

    collection.clients.push(newClient);
    collection.updatedAt = new Date();
    await collection.save();

    return {
      success: true,
      client: collection.clients[collection.clients.length - 1],
    };
  } catch (error) {
    console.error('Error creating client:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

export async function updateClient(clientId, clientData) {
  try {
    await connectDB();

    const collection = await Client.findOne();
    if (!collection) {
      return {
        success: false,
        error: 'Client collection not found',
      };
    }

    const clientIndex = collection.clients.findIndex(
      (c) => c._id.toString() === clientId
    );

    if (clientIndex === -1) {
      return {
        success: false,
        error: 'Client not found',
      };
    }

    collection.clients[clientIndex] = {
      ...collection.clients[clientIndex],
      ...clientData,
      _id: collection.clients[clientIndex]._id,
    };

    collection.updatedAt = new Date();
    await collection.save();

    return {
      success: true,
      client: collection.clients[clientIndex],
    };
  } catch (error) {
    console.error('Error updating client:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

export async function deleteClient(clientId) {
  try {
    await connectDB();

    const collection = await Client.findOne();
    if (!collection) {
      return {
        success: false,
        error: 'Client collection not found',
      };
    }

    const initialLength = collection.clients.length;
    collection.clients = collection.clients.filter(
      (c) => c._id.toString() !== clientId
    );

    if (collection.clients.length === initialLength) {
      return {
        success: false,
        error: 'Client not found',
      };
    }

    // Reorder remaining clients
    collection.clients.forEach((client, index) => {
      client.order = index;
    });

    collection.updatedAt = new Date();
    await collection.save();

    return {
      success: true,
    };
  } catch (error) {
    console.error('Error deleting client:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

export async function reorderClients(clientIds) {
  try {
    await connectDB();

    const collection = await Client.findOne();
    if (!collection) {
      return {
        success: false,
        error: 'Client collection not found',
      };
    }

    const newOrder = [];
    for (const id of clientIds) {
      const client = collection.clients.find((c) => c._id.toString() === id);
      if (client) {
        newOrder.push(client);
      }
    }

    if (newOrder.length !== collection.clients.length) {
      return {
        success: false,
        error: 'Invalid reorder request',
      };
    }

    newOrder.forEach((client, index) => {
      client.order = index;
    });

    collection.clients = newOrder;
    collection.updatedAt = new Date();
    await collection.save();

    return {
      success: true,
      clients: collection.clients,
    };
  } catch (error) {
    console.error('Error reordering clients:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}
