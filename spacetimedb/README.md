# Information:
  The build script to handle multiples into one. There is tags to sort by name tags.

```ts
function getTag(filePath: string): 'type' | 'table' | 'reducer' | 'procedure' | 'view' | 'lifecycle' | 'other' {
  const content = fs.readFileSync(filePath, 'utf-8').toLowerCase();

  if (content.includes('// types:') || content.includes('// type:')) return 'type';
  if (content.includes('// table:')) return 'table';
  if (content.includes('// reducer:')) return 'reducer';
  if (content.includes('// procedure:')) return 'procedure';
  if (content.includes('// view:')) return 'view';
  if (content.includes('// init') || 
      content.includes('// onconnect') || 
      content.includes('// ondisconnect') || 
      content.includes('// lifecycle')) return 'lifecycle';
  return 'other';
}
```

```ts
// types:
```
  Example this will tag the file, store and output single.