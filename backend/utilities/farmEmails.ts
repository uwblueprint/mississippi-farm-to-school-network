import * as firebaseAdmin from 'firebase-admin';
import IUserService from '@/services/interfaces/userService';
import { EmailTemplateData, UserDTO } from '@/types';

export type BuiltEmail = { subject: string; template: EmailTemplateData };
type FarmOwner = Pick<UserDTO, 'email' | 'firstName' | 'lastName'>;

export const frontendUrl = (path: string): string =>
  `${(process.env.FRONTEND_URL ?? 'http://localhost:5173').replace(/\/$/, '')}${path}`;

const ADMIN_GREETING = ['Hi Admin,'];
const UNKNOWN_OWNER = 'A farmer';

const farmerName = (firstName: string | null): string => firstName?.trim() || 'there';

export const ownerDisplayName = (owner: FarmOwner): string =>
  [owner.firstName, owner.lastName].filter(Boolean).join(' ') || owner.email;

export async function findFarmOwner(
  userService: IUserService,
  ownerUserId: string
): Promise<FarmOwner> {
  try {
    return await userService.getUserByFirebaseUid(ownerUserId);
  } catch {
    const { email, displayName } = await firebaseAdmin.auth().getUser(ownerUserId);
    if (!email) throw new Error(`Farm owner ${ownerUserId} has no email address.`);

    const [firstName = null, ...rest] = displayName?.trim().split(/\s+/) ?? [];
    return { email, firstName, lastName: rest.join(' ') || null };
  }
}

export async function findOwnerName(
  userService: IUserService,
  ownerUserId: string
): Promise<string | undefined> {
  try {
    return ownerDisplayName(await findFarmOwner(userService, ownerUserId));
  } catch {
    return undefined;
  }
}

export const newFarmEmail = (farmName: string, ownerName?: string): BuiltEmail => ({
  subject: '[ACTION REQUIRED] Farm Fresh Map - A new farm wants to join the map',
  template: {
    title: 'A new farm wants to join the map',
    previewText: `${farmName} has applied to join the MFSN Farm Fresh Map.`,
    paragraphs: [
      [{ bold: ADMIN_GREETING[0] }],
      [
        {
          bold: `${farmName}${ownerName ? `, owned by ${ownerName}` : ''} has applied to be added to the MFSN Farm Fresh Map. Review their details and approve the listing or request changes before it goes live.`,
        },
      ],
    ],
    ctaText: 'Review new farm',
    ctaUrl: frontendUrl('/admin'),
    isFarmerEmail: false,
  },
});

export const editRequestEmail = (farmName: string, ownerName?: string): BuiltEmail => ({
  subject: `[ACTION REQUIRED] Farm Fresh Map - Edit request for ${farmName}`,
  template: {
    title: `Edit request for ${farmName}`,
    previewText: `${farmName} has submitted updates for review.`,
    paragraphs: [
      ADMIN_GREETING,
      [
        { bold: ownerName ?? UNKNOWN_OWNER },
        ' has submitted updates to ',
        { bold: `${farmName}'s` },
        ' existing listing on the Farm Fresh Map. Review their details and approve the edit or request changes before it goes live.',
      ],
    ],
    ctaText: 'Review edit request',
    ctaUrl: frontendUrl('/admin'),
    isFarmerEmail: false,
  },
});

export const deletionRequestEmail = (farmName: string, ownerName?: string): BuiltEmail => ({
  subject: `[ACTION REQUIRED] Farm Fresh Map - Deletion request for ${farmName}`,
  template: {
    title: `Deletion request for ${farmName}`,
    previewText: `${farmName} has asked to be removed from the map.`,
    paragraphs: [
      ADMIN_GREETING,
      [
        { bold: ownerName ?? UNKNOWN_OWNER },
        ' has requested that ',
        { bold: farmName },
        ' be removed from the MFSN Farm Fresh Map. Once you approve, the farm will no longer appear in public search results.',
      ],
      ["Please review and confirm whenever you're ready."],
    ],
    ctaText: 'Review delete request',
    ctaUrl: frontendUrl('/admin'),
    isFarmerEmail: false,
  },
});

export const farmApprovedEmail = (farmName: string, firstName: string | null): BuiltEmail => ({
  subject: "You're on the MFSN Farm Fresh Map!",
  template: {
    title: "You're on the MFSN Farm Fresh Map!",
    previewText: `${farmName} is now live on the Farm Fresh Map.`,
    paragraphs: [
      firstName?.trim() ? ['Hi ', { bold: firstName.trim() }, ','] : ['Hi there,'],
      [
        { bold: farmName },
        " has been approved and is now live on the Mississippi Farm to School Network's Farm Fresh Map.",
      ],
      [
        'Families, schools, and buyers across your area can now find you and learn about what you grow. Take a look at your live listing and share it far and wide:',
      ],
    ],
    ctaText: 'View your farm',
    ctaUrl: frontendUrl('/farmer/farms'),
    closingText: "Thank you for being part of the network, we're glad to have you on the map!",
    isFarmerEmail: true,
  },
});

export const changesRequestedEmail = (
  farmName: string,
  firstName: string | null,
  reason: string
): BuiltEmail => ({
  subject: '[ACTION REQUIRED] MFSN Farm Fresh Map - A few changes needed for your farm listing',
  template: {
    title: 'A few changes needed for your farm listing',
    previewText: `Our team has asked for some changes to ${farmName}.`,
    paragraphs: [
      [`Hi ${farmerName(firstName)},`],
      [
        `Thanks for submitting ${farmName} to the Farm Fresh Map. Before we can publish your listing, our team has asked for some changes:`,
      ],
    ],
    reasonText: reason,
    paragraphsAfterReason: [
      [
        "Log back into the platform to make those updates and resubmit. We'll review it again as soon as we can 😄",
      ],
    ],
    ctaText: 'Update my farm',
    ctaUrl: frontendUrl('/farmer/farms'),
    isFarmerEmail: true,
  },
});

export const farmRemovedEmail = (farmName: string, firstName: string | null): BuiltEmail => ({
  subject: 'MFSN Farm Fresh Map - Your farm has been removed from the map',
  template: {
    title: 'Your farm has been removed from the map',
    previewText: `${farmName} has been removed from the Farm Fresh Map.`,
    paragraphs: [
      [`Hi ${farmerName(firstName)},`],
      [
        `This is a confirmation that ${farmName} has been removed from the Mississippi Farm to School Network's Farm Fresh Map and no longer appears in public listings.`,
      ],
      [
        "If this was a mistake, or you'd ever like to rejoin down the road, you're always welcome back. Just submit a new request anytime.",
      ],
    ],
    ctaText: 'Visit the Platform',
    ctaUrl: frontendUrl('/farms'),
    isFarmerEmail: true,
  },
});

export const verificationEmail = (verificationLink: string): BuiltEmail => ({
  subject: 'Verify Your Email for the Mississippi Farm Fresh Map',
  template: {
    title: 'Verify Your Email for the Mississippi Farm Fresh Map',
    previewText: 'Confirm your email to activate your Farm Fresh Map account.',
    paragraphs: [
      ['Hi there,'],
      [
        'Thanks for signing up for the MFSN Farm Fresh Map. Please verify your email to activate your account. This link is only valid for 1 hour.',
      ],
    ],
    ctaText: 'Verify email',
    ctaUrl: verificationLink,
    isFarmerEmail: true,
  },
});
