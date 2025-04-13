import { Pool } from 'pg';

const pool = new Pool({
  connectionString: 'postgresql://postgres:QiyiDzYtk3XnH0bQ@nimbly-vaulting-courser.data-1.use1.tembo.io:5432/postgres',
  ssl: {
    rejectUnauthorized: false,
    mode: 'prefer'
  }
});

export default pool;