import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Sequelize, DataTypes } from 'sequelize';
import { createRemoteJWKSet, jwtVerify } from 'jose';

dotenv.config();

const DB_SCHEMA = process.env.DB_SCHEMA || 'app';
const useSsl = process.env.PGSSLMODE === 'require';
const ASGARDEO_ORG = process.env.ASGARDEO_ORG || 'neworg2';

const app = express();

app.use(cors());
app.use(express.json());

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 5432,
    dialect: 'postgres',
    dialectOptions: useSsl
      ? {
          ssl: {
            require: true,
            rejectUnauthorized: false,
          },
        }
      : undefined,
    define: {
      schema: DB_SCHEMA,
    },
  }
);

const Puppies = sequelize.define(
  'puppies',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    breed: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    age: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    schema: DB_SCHEMA,
    tableName: 'puppies',
    timestamps: false,
  }
);

const JWKS = createRemoteJWKSet(
  new URL(`https://api.asgardeo.io/t/${ASGARDEO_ORG}/oauth2/jwks`)
);

async function verifyJwt(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    console.log('Authorization header received:', authHeader);

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }

    const token = authHeader.split(' ')[1];

    const { payload } = await jwtVerify(token, JWKS);

    req.userId = payload.sub;
    next();
  } catch (err) {
    console.error('JWT verification failed:', err);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.get('/puppies', verifyJwt, async (req, res) => {
  try {
    const puppies = await Puppies.findAll({
      where: { user_id: req.userId },
    });
    res.json(puppies);
  } catch (err) {
    console.error('Error fetching puppies:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/puppies/:id', verifyJwt, async (req, res) => {
  try {
    const puppy = await Puppies.findByPk(req.params.id);

    if (!puppy) {
      return res.status(404).json({ error: 'Puppy not found' });
    }

    if (puppy.user_id !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    res.json(puppy);
  } catch (err) {
    console.error('Error fetching puppy:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/puppies', verifyJwt, async (req, res) => {
  try {
    const { name, breed, age } = req.body;

    const newPuppy = await Puppies.create({
      name,
      breed,
      age,
      user_id: req.userId,
    });

    res.status(201).json(newPuppy);
  } catch (err) {
    console.error('Error creating puppy:', err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/puppies/:id', verifyJwt, async (req, res) => {
  try {
    const puppy = await Puppies.findByPk(req.params.id);

    if (!puppy) {
      return res.status(404).json({ error: 'Puppy not found' });
    }

    if (puppy.user_id !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { name, breed, age } = req.body;

    await puppy.update({
      name,
      breed,
      age,
    });

    res.json(puppy);
  } catch (err) {
    console.error('Error updating puppy:', err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/puppies/:id', verifyJwt, async (req, res) => {
  try {
    const puppy = await Puppies.findByPk(req.params.id);

    if (!puppy) {
      return res.status(404).json({ error: 'Puppy not found' });
    }

    if (puppy.user_id !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await puppy.destroy();
    res.json({ message: 'Puppy deleted successfully' });
  } catch (err) {
    console.error('Error deleting puppy:', err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5001;

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected...');

    await Puppies.sync({ alter: true });
    console.log(`Puppies model synced in schema "${DB_SCHEMA}".`);

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
};

startServer();