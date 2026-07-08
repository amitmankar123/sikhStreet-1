import mongoose from 'mongoose';
import crypto from 'crypto';

async function ensureDbConnected() {
  if (mongoose.connection.readyState === 0) {
    const { config } = await import('dotenv');
    config();
    const mongoUrl = process.env.DATABASE_URL || process.env.MONGO_URI;
    if (!mongoUrl) {
      throw new Error('DATABASE_URL/MONGO_URI is not defined in environment variables');
    }
    await mongoose.connect(mongoUrl);
  }
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function mapWhere(where, mongooseModel) {
  if (!where) return {};
  const filter = {};
  for (const [key, value] of Object.entries(where)) {
    if (key === 'OR' || key === 'AND' || key === 'NOT') {
      const mappedList = [];
      const items = Array.isArray(value) ? value : [value];
      for (const subWhere of items) {
        mappedList.push(await mapWhere(subWhere, mongooseModel));
      }
      if (key === 'OR') filter.$or = mappedList;
      else if (key === 'AND') filter.$and = mappedList;
      else if (key === 'NOT') filter.$and = mappedList.map(item => ({ $nor: [item] }));
      continue;
    }

    let targetKey = key === 'id' ? '_id' : key;

    // Check if it is a relation key
    if (!(targetKey in mongooseModel.schema.paths) && value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      let modelName = key.charAt(0).toUpperCase() + key.slice(1);
      if (key === 'deliveryBoy') modelName = 'DeliveryBoy';
      else if (key === 'wishlistItem') modelName = 'WishlistItem';
      else if (key === 'ticketType') modelName = 'TicketType';
      else if (key === 'pickupLocation') modelName = 'PickupLocation';
      else if (key === 'vendorChatThread') modelName = 'VendorChatThread';
      else if (key === 'vendorChatMessage') modelName = 'VendorChatMessage';
      else if (key === 'vendorDocument') modelName = 'VendorDocument';
      else if (key === 'vendorShippingRate') modelName = 'VendorShippingRate';
      else if (key === 'vendorShippingZone') modelName = 'VendorShippingZone';
      else if (key === 'customerUser') modelName = 'User';

      const relatedModel = mongoose.models[modelName];
      if (relatedModel) {
        const subFilter = await mapWhere(value, relatedModel);
        const relatedDocs = await relatedModel.find(subFilter).select('_id').lean().exec();
        const ids = relatedDocs.map(d => d._id);

        let fk = `${key}Id`;
        if (!(fk in mongooseModel.schema.paths)) {
          if (`${key}Ref` in mongooseModel.schema.paths) {
            fk = `${key}Ref`;
          } else if (key === 'customerUser') {
            fk = 'customerUserId';
          }
        }
        filter[fk] = { $in: ids };
        continue;
      }
    }

    if (value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      // Handle Prisma MongoDB JSON array search
      if (value.array_contains !== undefined) {
        if (value.path && Array.isArray(value.path) && value.path.length > 0) {
          const pathStr = value.path[0];
          const match = pathStr.match(/\$\[\*\]\.(\w+)/);
          if (match) {
            const subField = match[1];
            filter[`${targetKey}.${subField}`] = value.array_contains;
            continue;
          }
        }

        if (Array.isArray(value.array_contains)) {
          if (value.array_contains.length > 0) {
            const first = value.array_contains[0];
            if (typeof first === 'object' && first !== null) {
              filter[targetKey] = { $elemMatch: first };
            } else {
              filter[targetKey] = first;
            }
          }
        } else {
          filter[targetKey] = value.array_contains;
        }
        continue;
      }

      const opFilter = {};
      const isInsensitive = value.mode === 'insensitive';
      for (const [op, opVal] of Object.entries(value)) {
        if (op === 'in') opFilter.$in = opVal;
        else if (op === 'not') opFilter.$ne = opVal;
        else if (op === 'notIn') opFilter.$nin = opVal;
        else if (op === 'gte') opFilter.$gte = opVal;
        else if (op === 'lte') opFilter.$lte = opVal;
        else if (op === 'gt') opFilter.$gt = opVal;
        else if (op === 'lt') opFilter.$lt = opVal;
        else if (op === 'mode') { /* ignore */ }
        else if (op === 'equals') {
          if (isInsensitive) {
            opFilter.$regex = new RegExp('^' + escapeRegExp(String(opVal)) + '$', 'i');
          } else {
            opFilter.$eq = opVal;
          }
        }
        else if (op === 'contains') {
          opFilter.$regex = new RegExp(escapeRegExp(String(opVal)), 'i');
        }
        else opFilter[`$${op}`] = opVal;
      }
      filter[targetKey] = opFilter;
    } else {
      filter[targetKey] = value;
    }
  }
  return filter;
}

function mapOrderBy(orderBy) {
  if (!orderBy) return {};
  const sort = {};
  const orders = Array.isArray(orderBy) ? orderBy : [orderBy];
  for (const order of orders) {
    for (const [key, value] of Object.entries(order)) {
      let targetKey = key === 'id' ? '_id' : key;
      sort[targetKey] = value === 'desc' ? -1 : 1;
    }
  }
  return sort;
}

function mapUpdateData(data) {
  if (!data) return {};
  const set = {};
  const inc = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      if (value.increment !== undefined) {
        inc[key] = value.increment;
      } else if (value.decrement !== undefined) {
        inc[key] = -value.decrement;
      } else if (value.set !== undefined) {
        set[key] = value.set;
      } else {
        set[key] = value;
      }
    } else {
      set[key] = value;
    }
  }
  const update = {};
  if (Object.keys(set).length > 0) update.$set = set;
  if (Object.keys(inc).length > 0) update.$inc = inc;
  return update;
}

function mapDoc(doc) {
  if (!doc) return null;
  const item = { ...doc };
  if (item._id && !item.id) {
    item.id = typeof item._id === 'object' && item._id.toString ? item._id.toString() : item._id;
  }
  return item;
}

export function wrapModel(mongooseModel) {
  return mongooseModel;
}
