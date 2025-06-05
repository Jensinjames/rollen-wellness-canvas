import { describe, it, expect } from 'vitest'
import { buildCategoryTree } from './utils'
import type { Category } from './types'

describe('buildCategoryTree', () => {
  const categories: Category[] = [
    {
      id: '1',
      name: 'Parent A',
      color: 'red',
      is_active: true,
      sort_order: 2,
      level: 0,
      path: [],
      created_at: '',
      updated_at: '',
    },
    {
      id: '2',
      name: 'Child A1',
      color: 'blue',
      is_active: true,
      sort_order: 1,
      parent_id: '1',
      level: 1,
      path: [],
      created_at: '',
      updated_at: '',
    },
    {
      id: '3',
      name: 'Parent B',
      color: 'green',
      is_active: true,
      sort_order: 1,
      level: 0,
      path: [],
      created_at: '',
      updated_at: '',
    },
  ]

  it('nests children under their parents', () => {
    const tree = buildCategoryTree(categories)

    const parentA = tree.find(c => c.id === '1')
    const childIds = parentA?.children?.map(c => c.id)

    expect(childIds).toEqual(['2'])
  })

  it('sorts categories by sort_order', () => {
    const tree = buildCategoryTree(categories)
    const ids = tree.map(c => c.id)
    expect(ids).toEqual(['3', '1'])

    const parentA = tree.find(c => c.id === '1')!
    const childIds = parentA.children!.map(c => c.id)
    expect(childIds).toEqual(['2'])
  })
})
