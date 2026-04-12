# spacetimedb-app-transform2d

# License: MIT

# SpaceTimeDB
 - 2.1.0

# Transform 3D Hierarchy:
  This is transform 2D hierarchy to test parent and child matrix for position, rotation and scale. With the help of Grok AI agent. To able to use three js matrix and helper to handle transform 2D hierarchy. Note this use matrix3 not matrix4.
  
  It was tricky to setup 2d world with three javascript build. Since it 3D is convert to 2D that use x and y.

- Schedule Tables
- reducer (function for client to access)
- trigger event

## refs:
- https://spacetimedb.com/docs/databases/transactions-atomicity


![Screenshot of browser test](screenshots/transform3d20260410.png)

# Editor:
  Current testing the position, quaternion, scale to update for box transform 3d. Using the Tweakpane for debug sync from the SpaceTimeDB. Tweakpane required code how to setup and clean up and reuse ui.

## Features:
- [x] create entity
- [x] delete entity and check for transform 2d to delete match id
- [x] add transform 2d
- [x] remove transform 2d
- [x] select transform 2d
  - [x] position
  - [x] rotation
  - [x] scale
- [x] select entity display yellow marker if transform 3d is added.
- [x] parent
  - [x] using the reducer to update all transforms base on isDirty propagation.
- [ ] demo three js transform 3d hierarchy stand alone test.

# Server features:
- [x] transform 2D hierarchy
  - [x] still need to test more
  - [x] reducer
  - [x] position
  - [x] rotation
  - [x] scale
  - [x] parnet to child update.
  - [ ] schedule

# Config:
  Make sure the application database name match the server and client. Since using the ***spacetime dev*** command line to run development mode to watch and build.

## Client
```js
const DB_NAME = 'spacetime-app-transform2d';
```
## Server:
spacetime.json
```json
//...
"database": "spacetime-app-transform2d",
//...
```
spacetime.local.json
```json
//...
"database": "spacetime-app-transform2d",
//...
```

# Commands:
```
bun install
```
```
spacetime start
```
```
spacetime dev --server local
```
# SQL:
```
spacetime sql --server local spacetime-app-transform2d "SELECT * FROM entity"

spacetime sql --server local spacetime-app-transform2d "SELECT * FROM transform3d"

```
 For query table in command line.

# SQL to text file:

```
spacetime sql --server local spacetime-app-transform2d "SELECT * FROM transform2d" > backup_your_table.txt
```

# Delete
```
spacetime publish --server local spacetime-app-transform --delete-data
```
 In case bug and can't update table error.

# Credits:
- https://spacetimedb.com/docs
- Grok AI agent

# Server:
 - Note due to reducer have limited child to one to query. If more child to sub child it will not update the table. As it did say in docs.
 
## Tables:
```ts
export const entity = table(
  { 
    name: 'entity', 
    public: true,
  },
  {
    id: t.string().primaryKey(),
  }
);

export const transform2d = table(
  { 
    name: 'transform2d', 
    public: true,
  },
  {
    entityId: t.string().primaryKey(),
    parentId: t.string().optional(),
    isDirty:t.bool().default(true),
    position: SVector2,
    rotation: t.f32(),
    scale: SVector2,
    localMatrix: t.array(t.f32()).optional(),
    worldMatrix: t.array(t.f32()).optional(),
  }
);
```

# Client api:
  Work in progress.

## Entity
  Having id tag string for handle. For easy to add on to type of components.

### createEntity:
```js
  conn.reducers.createEntity({})
```
  Create blank entity.

### deleteEntity:
```js
  conn.reducers.deleteEntity({
    entiyId:PARAMS.entityId
  });
```
  Delete Entity base on entityId. Check for any components to be delete as well.
