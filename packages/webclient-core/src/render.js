/**
 * Render protocol: the contract between the core and *any* renderer.
 *
 * Nodes are plain, frozen, JSON-serializable objects — no DOM, no JSX, no
 * class instances. The React client, the custom element and any future
 * renderer all consume the same tree, which is what keeps the UI layer
 * replaceable.
 *
 *   { kind: 'element', type: 'card', props: {...}, children: [...] }
 *   { kind: 'text', text: 'Hello' }
 */

export const RENDER_PROTOCOL_VERSION = 1

const KINDS = new Set(['element', 'text'])

export function el(type, props = {}, children = []) {
  if (typeof type !== 'string' || type === '') {
    throw new TypeError('render.el: type must be a non-empty string')
  }
  return Object.freeze({
    kind: 'element',
    type,
    props: Object.freeze({ ...props }),
    children: Object.freeze(children.map(normalize)),
  })
}

export function tx(value) {
  return Object.freeze({ kind: 'text', text: String(value) })
}

function normalize(node) {
  if (node === null || node === undefined || typeof node === 'boolean') {
    return tx('')
  }
  if (typeof node === 'string' || typeof node === 'number') {
    return tx(node)
  }
  if (typeof node === 'object' && KINDS.has(node.kind)) {
    return node
  }
  throw new TypeError(`render: unsupported node ${JSON.stringify(node)}`)
}

/** Validates a tree at the boundary; returns it unchanged when valid. */
export function validateTree(node, path = '$') {
  if (node?.kind === 'text') {
    if (typeof node.text !== 'string') {
      throw new TypeError(`render: ${path} text node needs a string "text"`)
    }
    return node
  }
  if (node?.kind === 'element') {
    if (typeof node.type !== 'string' || node.type === '') {
      throw new TypeError(`render: ${path} element node needs a string "type"`)
    }
    if (node.props !== undefined && (typeof node.props !== 'object' || node.props === null)) {
      throw new TypeError(`render: ${path} element node "props" must be an object`)
    }
    node.children?.forEach((child, index) => validateTree(child, `${path}.children[${index}]`))
    return node
  }
  throw new TypeError(`render: ${path} is not a render node`)
}

export function walk(node, visitor) {
  visitor(node)
  if (node.kind === 'element') {
    for (const child of node.children ?? []) {
      walk(child, visitor)
    }
  }
  return node
}

/** Serializes a tree for transport (e.g. to a worker or an iframe). */
export function toJSON(node) {
  return JSON.stringify(validateTree(node))
}

export function fromJSON(json) {
  return validateTree(JSON.parse(json))
}
