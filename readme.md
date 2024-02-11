# Concurrent file duplicates finder

## Environment

Node `v20.11.0` had been used, but should work fine starting from `v16.11.0`. Not lower just because of `FileHandle.createReadStream` method.

* `npm install`
* `npm run solution-raw-comparing` or `npm run solution-hash-comparing`

## First solution. Raw content comparison

`npm run solution-raw-comparing`

That is a unefficient but funny solution. What it does:

1. Let's define `compare_files` background task - it receives two filenames and sends response with content comparison result (-1, 0 or 1). We're comparing raw binary contents - reading files by chunks until some difference or file end.
2. Read all filenames from a target directory into `filenames` array using recursive function, that iterates over all nested directories.
3. Core part: sorting filenames array with asynchronous variant of MergeSort algorithm using `compare_files` background task as a comparing function. That is the heaviest part with `O(n*logn)` complexity, where `n = filenames.length` and each iteration is request to background worker.
4. Finalize sorted `filenames` by grouping using `compare_files` - we can do it with a linear complexity.
5. Done!

PS: we could cache `compare_files` task requests to reuse 3rd step requests in 4th, but that is not really required.

## Second solution. Hashes comparison

`npm run solution-hash-comparing`

1. Let's define `obtain_file_hash` bakground task. It receives a `filename` and sends a response with `md5` hash of file content.
2. Read all filenames from a target directory into `filenames` array using recursive function, that iterates over all nested directories.
3. Generate hashes for each item of `filenames` array with `obtain_file_hash` task.
4. Create a map where keys are hashes and values are appropriate filenames for each hash. Values of this map will be an answer.
5. Done!

## What's better?

Well, I absolutely don't know where to apply first solution.
* It's much less efficient,
* harder to understand,
* and can not handle `compare_files` task failure (f.e. user can delete a file) - invalid `compare_files` result breaks sort algorithm.

The only advancement of first solution is sustainability to possible hash collisions in comparison with second variant, but it is not look like really dangerous thing.

PS: do not be afraid of slow working program. We're just running a workers with raw typescript files without precompiling, so it takes some time for workers to compile .ts and start handling messages.