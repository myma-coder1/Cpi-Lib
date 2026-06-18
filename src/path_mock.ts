export function join(...args: string[]) {
  return args.join('/');
}

export function dirname(p: string) {
  return p.split('/').slice(0, -1).join('/') || '.';
}

export default {
  join,
  dirname,
};
