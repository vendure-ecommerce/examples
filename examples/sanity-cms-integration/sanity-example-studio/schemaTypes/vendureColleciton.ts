import {defineField, defineType} from 'sanity'

export const vendureCollection = defineType({
  name: 'vendureCollection',
  title: 'Vendure Collection',
  type: 'document',
  fields: [
    defineField({
      name: 'vendureId',
      type: 'number',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      options: {source: 'title'},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'vendureProductVariants',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'vendureProductVariant'}]}],
    }),
  ],
})
