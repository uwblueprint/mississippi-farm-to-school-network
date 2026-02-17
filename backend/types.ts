export type SampleDTO = {
  id: string;
  name: string;
  description: string;
  createdAt: string; // ISO string for GraphQL compatibility
  updatedAt: string; // ISO string for GraphQL compatibility
};

export type CreateSampleDTO = {
  name: string;
  description: string;
};

export type NodemailerConfig = {
  service: 'gmail';
  auth: {
    type: 'OAuth2';
    user: string;
    clientId: string;
    clientSecret: string;
    refreshToken: string;
  };
};
