// This file is used to map the tool names to the tool display names and read only status
// This scales not very well, but it's a quick and dirty solution to detect if a tool is read only
// and to get a display name for the tool.

type Tool = {
  displayName: string;
  readOnly: boolean;
};

const toolMapping: Record<string, Tool> = {
  // custom tools
  think: { displayName: 'Thinking', readOnly: true },
  analyze_document_image: {
    displayName: 'Analyze Document Image',
    readOnly: true,
  },
  show_file_changes: { displayName: 'Show File Changes', readOnly: true },

  // mcp tools
  create_document: { displayName: 'Create Document', readOnly: false },
  copy_document: { displayName: 'Copy Document', readOnly: false },
  get_document_info: { displayName: 'Get Document Info', readOnly: true },
  get_document_text: { displayName: 'Get Document Text', readOnly: true },
  get_document_outline: { displayName: 'Get Document Outline', readOnly: true },
  list_available_documents: {
    displayName: 'List Available Documents',
    readOnly: true,
  },
  add_paragraph: { displayName: 'Add Paragraph', readOnly: false },
  add_heading: { displayName: 'Add Heading', readOnly: false },
  add_picture: { displayName: 'Add Picture', readOnly: false },
  add_table: { displayName: 'Add Table', readOnly: false },
  add_page_break: { displayName: 'Add Page Break', readOnly: false },
  delete_paragraph: { displayName: 'Delete Paragraph', readOnly: false },
  search_and_replace: { displayName: 'Search and Replace', readOnly: false },
  create_custom_style: { displayName: 'Create Custom Style', readOnly: false },
  format_text: { displayName: 'Format Text', readOnly: false },
  format_table: { displayName: 'Format Table', readOnly: false },
  protect_document: { displayName: 'Protect Document', readOnly: false },
  unprotect_document: { displayName: 'Unprotect Document', readOnly: false },
  add_footnote_to_document: { displayName: 'Add Footnote', readOnly: false },
  add_endnote_to_document: { displayName: 'Add Endnote', readOnly: false },
  customize_footnote_style: {
    displayName: 'Customize Footnote Style',
    readOnly: false,
  },
  get_paragraph_text_from_document: {
    displayName: 'Get Paragraph Text',
    readOnly: true,
  },
  find_text_in_document: {
    displayName: 'Find Text in Document',
    readOnly: true,
  },
  convert_to_pdf: { displayName: 'Convert to PDF', readOnly: true },
  apply_formula: { displayName: 'Apply Formula', readOnly: false },
  validate_formula_syntax: {
    displayName: 'Validate Formula Syntax',
    readOnly: true,
  },
  format_range: { displayName: 'Format Range', readOnly: false },
  read_data_from_excel: { displayName: 'Read Data from Excel', readOnly: true },
  write_data_to_excel: { displayName: 'Write Data to Excel', readOnly: false },
  create_workbook: { displayName: 'Create Workbook', readOnly: false },
  create_worksheet: { displayName: 'Create Worksheet', readOnly: false },
  create_chart: { displayName: 'Create Chart', readOnly: false },
  create_pivot_table: { displayName: 'Create Pivot Table', readOnly: false },
  create_table: { displayName: 'Create Table', readOnly: false },
  copy_worksheet: { displayName: 'Copy Worksheet', readOnly: false },
  delete_worksheet: { displayName: 'Delete Worksheet', readOnly: false },
  rename_worksheet: { displayName: 'Rename Worksheet', readOnly: false },
  get_workbook_metadata: {
    displayName: 'Get Workbook Metadata',
    readOnly: true,
  },
  merge_cells: { displayName: 'Merge Cells', readOnly: false },
  unmerge_cells: { displayName: 'Unmerge Cells', readOnly: false },
  get_merged_cells: { displayName: 'Get Merged Cells', readOnly: true },
  copy_range: { displayName: 'Copy Range', readOnly: false },
  delete_range: { displayName: 'Delete Range', readOnly: false },
  validate_excel_range: { displayName: 'Validate Excel Range', readOnly: true },
  get_data_validation_info: {
    displayName: 'Get Data Validation Info',
    readOnly: true,
  },
  read_file: { displayName: 'Read File', readOnly: true },
  read_multiple_files: { displayName: 'Read Multiple Files', readOnly: true },
  write_file: { displayName: 'Write File', readOnly: false },
  edit_file: { displayName: 'Edit File', readOnly: false },
  create_directory: { displayName: 'Create Directory', readOnly: false },
  list_directory: { displayName: 'List Directory', readOnly: true },
  directory_tree: { displayName: 'Directory Tree', readOnly: true },
  move_file: { displayName: 'Move File', readOnly: false },
  search_files: { displayName: 'Search Files', readOnly: true },
  get_file_info: { displayName: 'Get File Info', readOnly: true },
  list_allowed_directories: {
    displayName: 'List Allowed Directories',
    readOnly: true,
  },
};

const getToolMapping = (toolName: string): Tool => {
  return toolMapping[toolName];
};

export default getToolMapping;
