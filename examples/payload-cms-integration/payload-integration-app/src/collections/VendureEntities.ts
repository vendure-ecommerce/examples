import type { CollectionConfig } from 'payload'

export const VendureProduct: CollectionConfig = {
  slug: 'vendure-product',
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
  },
  fields: [
    {
      name: 'id',
      type: 'number',
      required: true,
      unique: true,
    },
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
    },
    {
      name: 'productVariants',
      type: 'relationship',
      relationTo: 'vendure-product-variant',
      hasMany: true,
    },
  ],
}

export const VendureProductVariant: CollectionConfig = {
  slug: 'vendure-product-variant',
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
  },
  fields: [
    {
      name: 'id',
      type: 'number',
      required: true,
      unique: true,
    },
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
    },
    {
      name: 'product',
      type: 'relationship',
      relationTo: 'vendure-product',
      hasMany: false,
    },
    {
      name: 'collections',
      type: 'relationship',
      relationTo: 'vendure-collection',
      hasMany: true,
    },
  ],
}

export const VendureCollection: CollectionConfig = {
  slug: 'vendure-collection',
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
  },
  fields: [
    {
      name: 'id',
      type: 'number',
      required: true,
      unique: true,
    },
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
    },
    {
      name: 'productVariants',
      type: 'relationship',
      relationTo: 'vendure-product-variant',
      hasMany: true,
    },
  ],
}
