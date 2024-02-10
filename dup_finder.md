# Concurrent file duplicates finder

## Task descriptions

Consider N-core machines, and given folder path find all identical (by content) files under it.
I.e. implement a function:
```typescript
Array<Array<string>> findIdentical(path: string) {
    ....
}
```
which returns list of lists, where inner list is the list of all file names with coinciding content:
```
dir1
  |- dir2
  |  |- file2
  |- file1
  |- file3
  |- file4
```
if content of file2 == content of file3, return list like this: `[[dir2/file2, file3], [file1], [file4]]`.

## Special considerations

Please ensure that code uses concurrent and async computations.



