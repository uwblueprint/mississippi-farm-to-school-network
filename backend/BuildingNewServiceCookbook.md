# Backend Cookbook: Adding a New Feature

A step-by-step guide for adding a new backend service/feature, following established patterns. We'll use a hypothetical **"Farmer"** feature as the running example.

> **Architecture overview:** Schema Design → Migration → Model → DTOs → Service Interface → Service Implementation → GraphQL Type → GraphQL Resolvers → Schema Registration

---

## Step 1: Design Your Schema

Before writing any code, design your table in the shared [dbdiagram.io schema](https://dbdiagram.io/d/Untitled-Diagram-698b5088bd82f5fce247c1e1). This is the source of truth for our database design.

For our Farmer example, the table would look something like:

```
Table farmers {
  id integer [pk, increment]
  farmName varchar [not null]
  firstName varchar [not null]
  lastName varchar [not null]
  address varchar [not null]
  city varchar [not null]
  state varchar [not null]
  zipCode varchar [not null]
  phoneNumber varchar [not null]
  email varchar [not null, unique]
  createdAt timestamp [not null]
  updatedAt timestamp [not null]
}
```

Once your schema is reviewed and agreed upon, move on to the next step.

---

## Step 2: Define Your DTOs

Add your TypeScript types to `types.ts`. These DTOs are shared across the service, resolver, and GraphQL layers.

**File:** `types.ts`

```typescript
export type FarmerDTO = {
  id: number;
  farmName: string;
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phoneNumber: string;
  email: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateFarmerDTO = {
  farmName: string;
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phoneNumber: string;
  email: string;
};
```

**Conventions:**
- `{Feature}DTO` for the read/response type (dates as ISO strings for GraphQL compatibility)
- `Create{Feature}DTO` for the creation input (omit `id`, `createdAt`, `updatedAt`)
- Add `Update{Feature}DTO` if your update payload differs from create
- You typically don't need a `Delete{Feature}DTO` — delete operations just take an `id: number` parameter directly

---

## Step 3: Create a Migration

Generate a new migration file using the CLI:

```bash
# MUST be run from the backend/ directory
node migrate create --name create-farmers.ts --folder migrations
```

This creates a timestamped file in `migrations/`. Open it and fill in the `up` and `down` functions:

**File:** `migrations/YYYY.MM.DDTHH.MM.SS.create-farmers.ts`

```typescript
import type { MigrationFn } from 'umzug/lib/types';
import type { Sequelize } from 'sequelize-typescript';
import { DataTypes } from 'sequelize';

export const up: MigrationFn = async (params) => {
  const sequelize = params.context as Sequelize;
  const queryInterface = sequelize.getQueryInterface();

  await queryInterface.createTable('farmers', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    farmName: { type: DataTypes.STRING, allowNull: false },
    firstName: { type: DataTypes.STRING, allowNull: false },
    lastName: { type: DataTypes.STRING, allowNull: false },
    address: { type: DataTypes.STRING, allowNull: false },
    city: { type: DataTypes.STRING, allowNull: false },
    state: { type: DataTypes.STRING, allowNull: false },
    zipCode: { type: DataTypes.STRING, allowNull: false },
    phoneNumber: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  });
};

export const down: MigrationFn = async (params) => {
  const sequelize = params.context as Sequelize;
  const queryInterface = sequelize.getQueryInterface();

  await queryInterface.dropTable('farmers');
};
```

**Run the migration:**

```bash
# MUST be run from the backend/ directory (migrate.js uses path aliases that resolve relative to it)
node migrate.js up
```

**Other useful migration commands:**

```bash
node migrate.js down      # Revert the last migration
node migrate.js pending   # List pending migrations
node migrate.js executed  # List executed migrations
```

---

## Step 4: Create the Sequelize Model

Create a model file that maps to your new table.

```bash
touch models/farmer.model.ts
```

**File:** `models/farmer.model.ts`

```typescript
import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table({ tableName: 'farmers' })
export default class Farmer extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  id!: number;

  @Column({ type: DataType.STRING })
  farmName!: string;

  @Column({ type: DataType.STRING })
  firstName!: string;

  @Column({ type: DataType.STRING })
  lastName!: string;

  @Column({ type: DataType.STRING })
  address!: string;

  @Column({ type: DataType.STRING })
  city!: string;

  @Column({ type: DataType.STRING })
  state!: string;

  @Column({ type: DataType.STRING })
  zipCode!: string;

  @Column({ type: DataType.STRING })
  phoneNumber!: string;

  @Column({ type: DataType.STRING })
  email!: string;

  @Column({ type: DataType.DATE })
  createdAt!: Date;

  @Column({ type: DataType.DATE })
  updatedAt!: Date;
}
```

**Conventions:**
- File named `{feature}.model.ts` in `models/`
- Class name is the singular PascalCase entity name
- `@Table` decorator with explicit `tableName`
- `@Column` decorator with explicit `DataType`
- Model fields use native types (`Date`, not `string`) — conversion to DTO happens in the service layer
- Export as default

> Models in `models/` are auto-discovered by Sequelize via the glob in `models/index.ts`, so no registration step is needed.

---

## Step 5: Create the Service Interface

Define the contract for your service.

```bash
touch services/interfaces/farmerService.ts
```

**File:** `services/interfaces/farmerService.ts`

```typescript
import { FarmerDTO, CreateFarmerDTO } from '@/types';

interface IFarmerService {
  /**
   * Get all farmers
   * @returns array of FarmerDTOs
   */
  getAllFarmers(): Promise<FarmerDTO[]>;

  /**
   * Get a farmer by their ID
   * @param id farmer ID
   * @returns a FarmerDTO
   * @throws Error if farmer not found
   */
  getFarmerById(id: number): Promise<FarmerDTO>;

  /**
   * Create a new farmer
   * @param content the farmer data
   * @returns the created FarmerDTO
   */
  createFarmer(content: CreateFarmerDTO): Promise<FarmerDTO>;

  /**
   * Update an existing farmer
   * @param id farmer ID
   * @param content the updated farmer data
   * @returns the updated FarmerDTO
   * @throws Error if farmer not found
   */
  updateFarmer(id: number, content: CreateFarmerDTO): Promise<FarmerDTO>;

  /**
   * Delete a farmer by ID
   * @param id farmer ID
   * @returns the deleted FarmerDTO
   * @throws Error if farmer not found
   */
  deleteFarmerById(id: number): Promise<FarmerDTO>;
}

export default IFarmerService;
```

**Conventions:**
- File named `{feature}Service.ts` in `services/interfaces/`
- Interface name prefixed with `I` (e.g., `IFarmerService`)
- All methods return `Promise<DTO>`
- JSDoc comments on each method
- Export as default

---

## Step 6: Create the Service Implementation

Implement the interface with actual database logic.

```bash
touch services/implementations/farmerService.ts
```

**File:** `services/implementations/farmerService.ts`

```typescript
import { FarmerDTO, CreateFarmerDTO } from '@/types';
import Farmer from '@/models/farmer.model';
import IFarmerService from '@/services/interfaces/farmerService';

const grabFarmer = async (farmerId: number): Promise<Farmer> => {
  const farmer = await Farmer.findByPk(farmerId);
  if (!farmer) {
    throw new Error(`FarmerId ${farmerId} not found.`);
  }
  return farmer;
};

class FarmerService implements IFarmerService {
  async getAllFarmers(): Promise<FarmerDTO[]> {
    const farmers = await Farmer.findAll();
    return farmers.map((farmer) => ({
      id: farmer.id,
      farmName: farmer.farmName,
      firstName: farmer.firstName,
      lastName: farmer.lastName,
      address: farmer.address,
      city: farmer.city,
      state: farmer.state,
      zipCode: farmer.zipCode,
      phoneNumber: farmer.phoneNumber,
      email: farmer.email,
      createdAt: farmer.createdAt.toISOString(),
      updatedAt: farmer.updatedAt.toISOString(),
    }));
  }

  async getFarmerById(id: number): Promise<FarmerDTO> {
    const farmer = await grabFarmer(id);
    return {
      id: farmer.id,
      farmName: farmer.farmName,
      firstName: farmer.firstName,
      lastName: farmer.lastName,
      address: farmer.address,
      city: farmer.city,
      state: farmer.state,
      zipCode: farmer.zipCode,
      phoneNumber: farmer.phoneNumber,
      email: farmer.email,
      createdAt: farmer.createdAt.toISOString(),
      updatedAt: farmer.updatedAt.toISOString(),
    };
  }

  async createFarmer(content: CreateFarmerDTO): Promise<FarmerDTO> {
    const farmer = await Farmer.create({
      farmName: content.farmName,
      firstName: content.firstName,
      lastName: content.lastName,
      address: content.address,
      city: content.city,
      state: content.state,
      zipCode: content.zipCode,
      phoneNumber: content.phoneNumber,
      email: content.email,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return {
      id: farmer.id,
      farmName: farmer.farmName,
      firstName: farmer.firstName,
      lastName: farmer.lastName,
      address: farmer.address,
      city: farmer.city,
      state: farmer.state,
      zipCode: farmer.zipCode,
      phoneNumber: farmer.phoneNumber,
      email: farmer.email,
      createdAt: farmer.createdAt.toISOString(),
      updatedAt: farmer.updatedAt.toISOString(),
    };
  }

  async updateFarmer(id: number, content: CreateFarmerDTO): Promise<FarmerDTO> {
    const farmer = await grabFarmer(id);
    farmer.farmName = content.farmName;
    farmer.firstName = content.firstName;
    farmer.lastName = content.lastName;
    farmer.address = content.address;
    farmer.city = content.city;
    farmer.state = content.state;
    farmer.zipCode = content.zipCode;
    farmer.phoneNumber = content.phoneNumber;
    farmer.email = content.email;
    farmer.updatedAt = new Date();
    await farmer.save();
    return {
      id: farmer.id,
      farmName: farmer.farmName,
      firstName: farmer.firstName,
      lastName: farmer.lastName,
      address: farmer.address,
      city: farmer.city,
      state: farmer.state,
      zipCode: farmer.zipCode,
      phoneNumber: farmer.phoneNumber,
      email: farmer.email,
      createdAt: farmer.createdAt.toISOString(),
      updatedAt: farmer.updatedAt.toISOString(),
    };
  }

  async deleteFarmerById(id: number): Promise<FarmerDTO> {
    const farmer = await grabFarmer(id);
    await farmer.destroy();
    return {
      id: farmer.id,
      farmName: farmer.farmName,
      firstName: farmer.firstName,
      lastName: farmer.lastName,
      address: farmer.address,
      city: farmer.city,
      state: farmer.state,
      zipCode: farmer.zipCode,
      phoneNumber: farmer.phoneNumber,
      email: farmer.email,
      createdAt: farmer.createdAt.toISOString(),
      updatedAt: farmer.updatedAt.toISOString(),
    };
  }
}

export default FarmerService;
```

**Conventions:**
- File named `{feature}Service.ts` in `services/implementations/`
- Class implements the corresponding `I{Feature}Service` interface
- Helper `grab{Feature}` function for findByPk + not-found error pattern
- Convert model `Date` fields to ISO strings when mapping to DTOs
- Set `createdAt`/`updatedAt` explicitly on create/update
- Export as default

---

## Step 7: Create the GraphQL Type Definition

Define the GraphQL schema for your feature.

```bash
touch graphql/types/farmerType.ts
```

**File:** `graphql/types/farmerType.ts`

```typescript
import { gql } from 'apollo-server';

const farmerType = gql`
  type Query {
    farmerById(id: Int!): FarmerDTO!
    farmers: [FarmerDTO!]!
  }

  type Mutation {
    createFarmer(farmer: CreateFarmerDTO!): FarmerDTO!
    updateFarmer(id: Int!, farmer: CreateFarmerDTO!): FarmerDTO!
    deleteFarmerById(id: Int!): FarmerDTO!
  }

  type FarmerDTO {
    id: Int!
    farmName: String!
    firstName: String!
    lastName: String!
    address: String!
    city: String!
    state: String!
    zipCode: String!
    phoneNumber: String!
    email: String!
    createdAt: String!
    updatedAt: String!
  }

  input CreateFarmerDTO {
    farmName: String!
    firstName: String!
    lastName: String!
    address: String!
    city: String!
    state: String!
    zipCode: String!
    phoneNumber: String!
    email: String!
  }
`;

export default farmerType;
```

**Conventions:**
- File named `{feature}Type.ts` in `graphql/types/`
- Extend `type Query` and `type Mutation` (GraphQL merges these across type defs)
- Output types match `{Feature}DTO` from `types.ts`
- Input types use the `input` keyword and match `Create{Feature}DTO`
- Use `Int!` for integer IDs, `ID!` for string IDs, `String!` for dates
- Export as default

---

## Step 8: Create the GraphQL Resolvers

Wire up the GraphQL operations to your service.

```bash
touch graphql/resolvers/farmerResolvers.ts
```

**File:** `graphql/resolvers/farmerResolvers.ts`

```typescript
import FarmerService from '@/services/implementations/farmerService';
import IFarmerService from '@/services/interfaces/farmerService';
import { CreateFarmerDTO } from '@/types';

const farmerService: IFarmerService = new FarmerService();

const farmerResolvers = {
  Query: {
    farmerById: async (_: unknown, { id }: { id: number }) => {
      return farmerService.getFarmerById(id);
    },
    farmers: async () => {
      return farmerService.getAllFarmers();
    },
  },
  Mutation: {
    createFarmer: async (_: unknown, { farmer }: { farmer: CreateFarmerDTO }) => {
      return farmerService.createFarmer(farmer);
    },
    updateFarmer: async (
      _: unknown,
      { id, farmer }: { id: number; farmer: CreateFarmerDTO }
    ) => {
      return farmerService.updateFarmer(id, farmer);
    },
    deleteFarmerById: async (_: unknown, { id }: { id: number }) => {
      return farmerService.deleteFarmerById(id);
    },
  },
};

export default farmerResolvers;
```

**Conventions:**
- File named `{feature}Resolvers.ts` in `graphql/resolvers/`
- Instantiate services at module level, typed against the interface
- First resolver arg is `_: unknown` (unused parent)
- Destructure the args object for type safety
- Resolvers are thin — just delegate to service methods
- Export as default

---

## Step 9: Register in the GraphQL Schema

Update `graphql/index.ts` to include your new type and resolvers.

**File:** `graphql/index.ts`

Add your imports and include them in the schema:

```typescript
import { makeExecutableSchema } from '@graphql-tools/schema';
import merge from 'lodash/merge';

import emailResolvers from '@/graphql/resolvers/emailResolvers';
import sampleResolvers from '@/graphql/resolvers/sampleResolvers';
import userResolvers from '@/graphql/resolvers/userResolvers';
import authResolvers from '@/graphql/resolvers/authResolvers';
import farmerResolvers from '@/graphql/resolvers/farmerResolvers';     // +++ ADD
import emailType from '@/graphql/types/emailType';
import sampleType from '@/graphql/types/sampleType';
import userType from '@/graphql/types/userType';
import authType from '@/graphql/types/authType';
import farmerType from '@/graphql/types/farmerType';                   // +++ ADD

const executableSchema = makeExecutableSchema({
  typeDefs: [sampleType, emailType, userType, authType, farmerType],   // +++ ADD farmerType
  resolvers: merge(
    sampleResolvers,
    emailResolvers,
    userResolvers,
    authResolvers,
    farmerResolvers,                                                   // +++ ADD farmerResolvers
  ),
});

export default executableSchema;
```

---

## Step 10: Verify

```bash
# Lint your new files
npm run lint

# Fix any formatting issues
npm run lint:fix

# Start the dev server
npm run dev
```

Once the server is running, open the Apollo Playground at `http://localhost:3000` and test your queries/mutations:

```graphql
# Test query
query {
  farmers {
    id
    farmName
    firstName
    lastName
    city
    state
  }
}

# Test mutation
mutation {
  createFarmer(farmer: {
    farmName: "Green Acres Farm"
    firstName: "John"
    lastName: "Smith"
    address: "123 Farm Road"
    city: "Jackson"
    state: "MS"
    zipCode: "39201"
    phoneNumber: "601-555-0123"
    email: "john@greenacres.com"
  }) {
    id
    farmName
    email
  }
}
```

---

## Quick Reference: Files to Create/Edit

| Step | Action | Path |
|------|--------|------|
| 1 | Design | [dbdiagram.io schema](https://dbdiagram.io/d/Untitled-Diagram-698b5088bd82f5fce247c1e1) |
| 2 | Edit | `types.ts` |
| 3 | Create | `migrations/YYYY.MM.DDTHH.MM.SS.create-{feature}.ts` |
| 4 | Create | `models/{feature}.model.ts` |
| 5 | Create | `services/interfaces/{feature}Service.ts` |
| 6 | Create | `services/implementations/{feature}Service.ts` |
| 7 | Create | `graphql/types/{feature}Type.ts` |
| 8 | Create | `graphql/resolvers/{feature}Resolvers.ts` |
| 9 | Edit | `graphql/index.ts` |

## Quick Reference: CLI Commands

```bash
# All commands MUST be run from the backend/ directory

# Migrations
node migrate create --name create-{feature}.ts --folder migrations   # Create a new migration
node migrate.js up          # Run pending migrations
node migrate.js down        # Revert the last migration
node migrate.js pending     # List pending migrations
node migrate.js executed    # List executed migrations

# Development
npm run dev                 # Start dev server with hot reload
npm run lint                # Check linting
npm run lint:fix            # Auto-fix lint + formatting
npm run format              # Format with Prettier

# Build
npm run build               # Compile TypeScript
npm run start               # Start compiled build
```
