import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/watch-store';

async function seedAdmin() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    const db = client.db();

    const username = process.argv[2] || 'admin';
    const password = process.argv[3] || 'admin123';

    // Check if admin already exists
    const existingAdmin = await db.collection('admins').findOne({ username });
    
    if (existingAdmin) {
      console.log(`Admin user "${username}" already exists.`);
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create admin
    const result = await db.collection('admins').insertOne({
      username,
      passwordHash,
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log(`Admin user "${username}" created successfully!`);
    console.log(`ID: ${result.insertedId}`);
    console.log(`Username: ${username}`);
    console.log(`Password: ${password}`);
  } catch (error) {
    console.error('Error seeding admin:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

seedAdmin();

