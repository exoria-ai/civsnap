import { TemplateDefinition } from '../types';

export const templates: TemplateDefinition[] = [
  {
    id: 'address-snapshot',
    name: 'Address Snapshot',
    description: 'Counter handout with parcel info, zoning, jurisdiction, hazards, and nearby POIs',
    icon: '📋',
    options: [
      {
        id: 'include_hazards',
        label: 'Include Hazards',
        type: 'boolean',
        default: true,
      },
      {
        id: 'include_districts',
        label: 'Include Districts',
        type: 'boolean',
        default: true,
      },
      {
        id: 'include_nearby',
        label: 'Include Nearby POIs',
        type: 'boolean',
        default: true,
      },
    ],
  },
  {
    id: 'plain-language',
    name: 'Plain-Language Explainer',
    description: 'AI-transformed property info for homeowners and residents',
    icon: '💬',
    options: [
      {
        id: 'audience',
        label: 'Audience',
        type: 'select',
        default: 'homeowner',
        options: [
          { value: 'homeowner', label: 'Homeowner' },
          { value: 'buyer', label: 'Prospective Buyer' },
          { value: 'resident', label: 'Resident' },
        ],
      },
    ],
  },
  {
    id: 'neighbor-notification',
    name: 'Neighbor Notification Exhibit',
    description: 'Buffer map with affected parcel count for planning notifications',
    icon: '📍',
    options: [
      {
        id: 'buffer_distance',
        label: 'Buffer Distance',
        type: 'select',
        default: '500',
        options: [
          { value: '300', label: '300 ft' },
          { value: '500', label: '500 ft' },
          { value: '1000', label: '1000 ft' },
        ],
      },
      {
        id: 'project_name',
        label: 'Project Name',
        type: 'select',
        default: '',
        options: [],
      },
    ],
  },
];

export function getTemplate(id: string): TemplateDefinition | undefined {
  return templates.find((t) => t.id === id);
}
