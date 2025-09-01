import {defineField, defineType} from 'sanity'

export const vendureProductVariant = defineType({
  name: 'vendureProductVariant',
  title: 'Vendure Product Variant',
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
      name: 'vendureProduct',
      type: 'reference',
      to: [{type: 'vendureProduct'}],
    }),
    defineField({
      name: 'vendureCollecitons',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'vendureCollection'}]}],
    }),
  ],
})
