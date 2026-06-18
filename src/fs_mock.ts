export function existsSync() {
  return false;
}

export function readFileSync() {
  return '';
}

export function writeFileSync() {
  return;
}

export default {
  existsSync,
  readFileSync,
  writeFileSync,
};
