import bcrypt from 'bcrypt';
import { db } from '@vercel/postgres';
import { invoices, customers, revenue, users } from '../lib/placeholder-data';

const connectionString = process.env.POSTGRES_URL;
if (!connectionString) {
    throw new Error('Missing POSTGRES_URL environment variable');
}

const client = await db.connect({ connectionString });

async function seedUsers() {
  await client.sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
  await client.sql`
    CREATE TABLE IF NOT EXISTS users (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL
    );
  `;

  const insertedUsers = await Promise.all(
    users.map(async (user) => {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      return client.sql`
        INSERT INTO users (id, name, email, password)
        VALUES (${user.id}, ${user.name}, ${user.email}, ${hashedPassword})
        ON CONFLICT (id) DO NOTHING;
      `;
    })
  );

  return insertedUsers;
}

// Implementasi seedInvoices, seedCustomers, dan seedRevenue seperti di atas...

export async function GET() {
  try {
      await client.sql `BEGIN`;
      await seedUsers();
      await seedCustomers();
      await seedInvoices();
      await seedRevenue();
      await client.sql `COMMIT`;

      return new Response(JSON.stringify({ message: 'Database seeded successfully' }), { status: 200 });
  } catch (error) {
      await client.sql `ROLLBACK`;
      return new Response(
          JSON.stringify({
              message: 'Failed to seed database. Error: ' + error.message,
          }), { status: 500, headers: { 'Content-Type': 'application/json' }  }    );  
  }
}
