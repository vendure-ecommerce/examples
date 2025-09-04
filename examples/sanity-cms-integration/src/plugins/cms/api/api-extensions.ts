import gql from "graphql-tag";

const cmsSyncAdminApiExtensions = gql`
  type CmsSyncResult {
    success: Boolean!
    message: String!
    entityId: String!
    entityType: String!
  }

  type CmsSyncError {
    entityId: String!
    entityType: String!
    error: String!
    attempts: Int!
  }

  type BulkCmsSyncResult {
    success: Boolean!
    totalEntities: Int!
    successCount: Int!
    errorCount: Int!
    message: String!
    entityType: String!
    errors: [CmsSyncError!]!
  }

  extend type Query {
    getCmsSyncStatus: String!
  }

  extend type Mutation {
    # Entity-agnostic mutations
    syncEntityToCms(id: ID!, entityType: String!): CmsSyncResult!
    syncAllEntitiesToCms(entityType: String!): BulkCmsSyncResult!
    
    # Convenience mutations (backwards compatibility)
    syncProductToCms(id: ID!): CmsSyncResult!
    syncAllProductsToCms: BulkCmsSyncResult!
  }
`;

export const adminApiExtensions = gql`
  ${cmsSyncAdminApiExtensions}
`;
