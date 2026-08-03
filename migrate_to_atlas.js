const { MongoClient } = require('mongodb');
const dns = require('dns');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'backend', '.env') });

try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}


const LOCAL_URI = 'mongodb://localhost:27017';
const ATLAS_URI = process.env.DATABASE_URL || 'mongodb+srv://amit:amit123@cluster0.lscud.mongodb.net/SikhStreet?appName=Cluster0';
const LOCAL_DB_NAME = 'sikhstreet';
const ATLAS_DB_NAME = 'SikhStreet';

async function migrate() {
  let localClient, atlasClient;
  try {
    console.log('Connecting to local MongoDB...');
    localClient = new MongoClient(LOCAL_URI);
    await localClient.connect();
    console.log('Connected to local MongoDB');

    console.log('Connecting to Atlas...');
    atlasClient = new MongoClient(ATLAS_URI);
    await atlasClient.connect();
    console.log('Connected to MongoDB Atlas');

    const localDb = localClient.db(LOCAL_DB_NAME);
    const atlasDb = atlasClient.db(ATLAS_DB_NAME);

    const collections = await localDb.listCollections().toArray();
    console.log('\nFound ' + collections.length + ' collections:\n');
    collections.forEach(c => console.log('  - ' + c.name));
    console.log('');

    let totalDocs = 0;
    for (const collInfo of collections) {
      const collName = collInfo.name;
      const localColl = localDb.collection(collName);
      const atlasColl = atlasDb.collection(collName);
      const count = await localColl.countDocuments();
      console.log('Migrating: ' + collName + ' (' + count + ' docs)');
      if (count === 0) { console.log('  SKIPPED (empty)'); continue; }
      const docs = await localColl.find({}).toArray();
      const existingCount = await atlasColl.countDocuments();
      if (existingCount > 0) {
        console.log('  Clearing ' + existingCount + ' existing docs in Atlas...');
        await atlasColl.deleteMany({});
      }
      const BATCH = 500;
      let inserted = 0;
      for (let i = 0; i < docs.length; i += BATCH) {
        const batch = docs.slice(i, i + BATCH);
        await atlasColl.insertMany(batch, { ordered: false });
        inserted += batch.length;
      }
      console.log('  DONE: ' + inserted + ' documents migrated');
      totalDocs += inserted;
    }
    console.log('\n=== MIGRATION COMPLETE ===');
    console.log('Total: ' + totalDocs + ' documents across ' + collections.length + ' collections');
    console.log('Atlas DB: ' + ATLAS_DB_NAME);
  } catch (err) {
    console.error('MIGRATION FAILED: ' + err.message);
    process.exit(1);
  } finally {
    if (localClient) await localClient.close();
    if (atlasClient) await atlasClient.close();
  }
}
migrate();
