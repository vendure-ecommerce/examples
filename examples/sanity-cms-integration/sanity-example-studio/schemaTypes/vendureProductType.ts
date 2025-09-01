import {defineField, defineType} from 'sanity'

export const vendureProductType = defineType({
  name: 'vendureProduct',
  title: 'Vendure Product',
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
      name: 'vendureVariants',
      type: 'array',
      of: [{type: 'reference', to: {type: 'vendureProductVariant'}}],
    }),
  ],
})
