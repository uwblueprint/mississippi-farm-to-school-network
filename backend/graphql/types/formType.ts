import { gql } from 'apollo-server';

const formType = gql`
  enum FormQuestionType {
    TEXT
    TEXTAREA
    NUMBER
    URL
    CHECKBOX
    "A fixed farm field (name, address, ...) admins can't edit or remove."
    LOCKED
  }

  enum LockedFormField {
    USDA_FARM_ID
    FARM_NAME
    FARM_ADDRESS
    COUNTY
    PRIMARY_PHONE
    PRIMARY_EMAIL
    PHOTOS
  }

  type FormOption {
    id: ID!
    label: String!
  }

  "Shows a question once questionId has any of optionIds checked (any choice when empty)."
  type FormCondition {
    questionId: ID!
    optionIds: [ID!]!
  }

  type FormQuestion {
    id: ID!
    type: FormQuestionType!
    label: String!
    required: Boolean!
    placeholder: String
    helpText: String
    options: [FormOption!]!
    "A choice (e.g. None of the above) that can't be combined with the others."
    exclusiveOptionId: ID
    showIf: FormCondition
    lockedField: LockedFormField
  }

  type FormSection {
    id: ID!
    title: String!
    questions: [FormQuestion!]!
  }

  type FormVersionDTO {
    id: ID!
    version: Int!
    sections: [FormSection!]!
    createdBy: ID
    createdAt: String!
  }

  input FormOptionInput {
    id: ID!
    label: String!
  }

  input FormConditionInput {
    questionId: ID!
    optionIds: [ID!]!
  }

  input FormQuestionInput {
    id: ID!
    type: FormQuestionType!
    label: String!
    required: Boolean!
    placeholder: String
    helpText: String
    options: [FormOptionInput!]
    exclusiveOptionId: ID
    showIf: FormConditionInput
    lockedField: LockedFormField
  }

  input FormSectionInput {
    id: ID!
    title: String!
    questions: [FormQuestionInput!]!
  }

  type Query {
    "The farmer form new farms are submitted with."
    publishedForm: FormVersionDTO!
  }

  type Mutation {
    """
    Admin only. Publishes a new form version; older versions stay as they were.
    baseVersionId is the version that was edited, and must still be the latest.
    """
    saveForm(baseVersionId: ID!, sections: [FormSectionInput!]!): FormVersionDTO!
  }
`;

export default formType;
