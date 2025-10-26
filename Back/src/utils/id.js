let counter = 0;

function generateId(prefix = '') {
  counter = (counter + 1) % Number.MAX_SAFE_INTEGER;
  const time = Date.now().toString(36);
  const count = counter.toString(36);
  return `${prefix}${time}${count}`;
}

module.exports = { generateId };
