import { IconDatabase, IconKey, IconLink, IconTags } from '@tabler/icons-react';

export interface SalesforceField {
  name: string;
  label: string;
  type: string;
  length: number;
  precision: number;
  scale: number;
  nillable: boolean;
  unique: boolean;
  calculated: boolean;
  custom: boolean;
  createable: boolean;
  updateable: boolean;
  externalId: boolean;
  idLookup: boolean;
  picklistValues: Array<{ label: string; value: string; active: boolean }>;
  relationshipName: string;
  referenceTo: string[];
  dependentPicklist: boolean;
  controllerName: string;
  soapType: string;
}

export interface SalesforceObject {
  name: string;
  label: string;
  labelPlural: string;
  keyPrefix: string;
  custom: boolean;
  createable: boolean;
  deletable: boolean;
  queryable: boolean;
  searchable: boolean;
  updateable: boolean;
  recordTypeInfos: any[];
}

export function getFieldTypeColor(type: string): string {
  switch (type.toLowerCase()) {
    case 'id':
      return 'yellow';
    case 'string':
    case 'textarea':
    case 'phone':
    case 'email':
    case 'url':
      return 'blue';
    case 'boolean':
      return 'green';
    case 'int':
    case 'double':
    case 'currency':
    case 'percent':
      return 'orange';
    case 'date':
    case 'datetime':
    case 'time':
      return 'cyan';
    case 'reference':
      return 'red';
    case 'picklist':
    case 'multipicklist':
      return 'teal';
    default:
      return 'gray';
  }
}

export function getFieldTypeIcon(type: string) {
  switch (type.toLowerCase()) {
    case 'id':
      return <IconKey size={14} />;
    case 'reference':
      return <IconLink size={14} />;
    case 'picklist':
    case 'multipicklist':
      return <IconTags size={14} />;
    default:
      return <IconDatabase size={14} />;
  }
}

export function getFieldTypeIconSmall(type: string) {
  switch (type.toLowerCase()) {
    case 'id':
      return <IconKey size={12} />;
    case 'reference':
      return <IconLink size={12} />;
    case 'picklist':
    case 'multipicklist':
      return <IconTags size={12} />;
    default:
      return <IconDatabase size={12} />;
  }
}
