import { gql } from 'apollo-server';

const emailType = gql`
  type Query {
    _empty: String
  }

  type Mutation {
    sendEmail(
      to: String!
      subject: String!
      htmlBody: String
      title: String
      body: String
      actionButtonLabel: String
      actionButtonHref: String
      previewText: String
      footerText: String
      recipientName: String
      reasonText: String
      ctaText: String
      ctaUrl: String
      isFarmerEmail: Boolean
    ): Boolean!
  }
`;

export default emailType;
