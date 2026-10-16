import { gql } from 'apollo-server';

const announcementType = gql`
  type Query {
    liveAnnouncements: [AnnouncementDTO!]!
    publicAnnouncements: [PublicAnnouncementDTO!]!
    liveAndUpcomingAnnouncements: [AnnouncementDTO!]!
    pastAnnouncements: [AnnouncementDTO!]!
  }

  type Mutation {
    createAnnouncement(input: CreateAnnouncementInput!): OverlapWarning!
    updateAnnouncement(id: ID!, input: UpdateAnnouncementInput!): OverlapWarning!
    deleteAnnouncement(id: ID!): AnnouncementDTO!
  }

  type AnnouncementDTO {
    id: ID!
    message: String!
    start_date: String!
    end_date: String
    deleted_at: String
    created_by: ID!
    createdAt: String!
    updatedAt: String!
  }

  "Live announcement as shown to signed-out visitors on the public farm map."
  type PublicAnnouncementDTO {
    id: ID!
    message: String!
    start_date: String!
    end_date: String
  }

  type OverlapWarning {
    announcement: AnnouncementDTO!
    overlappingAnnouncements: [AnnouncementDTO!]!
  }

  input CreateAnnouncementInput {
    message: String!
    start_date: String!
    end_date: String
  }

  input UpdateAnnouncementInput {
    message: String
    start_date: String
    end_date: String
  }
`;

export default announcementType;
