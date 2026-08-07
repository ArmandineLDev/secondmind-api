/** Types de champ possibles pour une colonne de collection. */
export type CollectionFieldType = 'text' | 'number' | 'select' | 'date' | 'checkbox' | 'url'

export interface Collection {
  id: string
  organization_id: string
  /** null = collection globale au workspace, non rattachée à un projet. */
  project_id: string | null
  name: string
  icon: string | null
  created_at: Date
  updated_at: Date
}

export interface CollectionField {
  id: string
  collection_id: string
  name: string
  type: CollectionFieldType
  /** Choix disponibles — renseigné uniquement pour un champ `select`. */
  options: string[] | null
  position: number
}

export interface CollectionItem {
  id: string
  collection_id: string
  /**
   * Valeurs de l'entrée, indexées par l'**id du champ** et non par son nom :
   * renommer une colonne ne doit pas orpheliner les données déjà saisies.
   */
  data: Record<string, unknown>
  created_at: Date
  updated_at: Date
}

/** Une collection accompagnée de ses colonnes — ce que renvoie le détail. */
export interface CollectionWithFields extends Collection {
  fields: CollectionField[]
}
