try {
  require(undefined);
} catch (e) {
  console.log("require(undefined) throws:", e.message);
}

try {
  import(undefined).catch(e => {
    console.log("import(undefined) throws:", e.message);
  });
} catch (e) {
  console.log("import(undefined) throws synchronously:", e.message);
}
