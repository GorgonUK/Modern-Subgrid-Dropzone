export interface RelationshipWrapper {
    relationshipMetadata: RelationshipMetadata;
  }

  export interface RelationshipMetadata {
    ReferencedAttribute: string;
    ReferencedEntity: string;
    ReferencedEntityNavigationPropertyName: string;
    ReferencingAttribute: string;
    ReferencingEntity: string;
    ReferencingEntityPlural?: string;
    ReferencingEntityNavigationPropertyName: string;
    SchemaName: string;
  }