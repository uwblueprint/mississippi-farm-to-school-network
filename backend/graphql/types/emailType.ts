import { gql } from 'apollo-server';

const emailType = gql`
  type Query {
    _empty: String
  }

  type Mutation {
    sendEmail(to: String!, subject: String!, htmlBody: String!): Boolean!
  }
`;

export default emailType;
