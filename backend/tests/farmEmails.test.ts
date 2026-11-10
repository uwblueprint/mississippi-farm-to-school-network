import React from 'react';
import { EmailLayout } from '@/services/implementations/emailService';
import { EmailTemplateData } from '@/types';
import {
  changesRequestedEmail,
  deletionRequestEmail,
  editRequestEmail,
  farmApprovedEmail,
  farmRemovedEmail,
  findFarmOwner,
  findOwnerName,
  newFarmEmail,
  ownerDisplayName,
  verificationEmail,
} from '@/utilities/farmEmails';
import IUserService from '@/services/interfaces/userService';
import { Role, UserDTO } from '@/types';

jest.mock('nodemailer', () => ({ createTransport: jest.fn() }));

const mockGetAuthUser = jest.fn();
jest.mock('firebase-admin', () => ({ auth: () => ({ getUser: mockGetAuthUser }) }));

const owner: UserDTO = {
  id: 'owner-1',
  firebase_uid: 'owner-1',
  email: 'owner@example.com',
  role: Role.FARMER,
  is_verified: true,
  firstName: null,
  lastName: null,
  phone: null,
};

const { renderToStaticMarkup } = jest.requireActual<{
  renderToStaticMarkup: (element: React.ReactElement) => string;
}>('react-dom/server');

const html = (template: EmailTemplateData) =>
  renderToStaticMarkup(React.createElement(EmailLayout, template));
const text = (template: EmailTemplateData) => JSON.stringify(template);

describe('farm email copy', () => {
  test.each([
    [
      newFarmEmail('Two Brooks', 'Sam Lee'),
      '[ACTION REQUIRED] Farm Fresh Map - A new farm wants to join the map',
    ],
    [
      editRequestEmail('Two Brooks', 'Sam Lee'),
      '[ACTION REQUIRED] Farm Fresh Map - Edit request for Two Brooks',
    ],
    [
      deletionRequestEmail('Two Brooks', 'Sam Lee'),
      '[ACTION REQUIRED] Farm Fresh Map - Deletion request for Two Brooks',
    ],
    [farmApprovedEmail('Two Brooks', 'Sam'), "You're on the MFSN Farm Fresh Map!"],
    [
      changesRequestedEmail('Two Brooks', 'Sam', 'Add a phone'),
      '[ACTION REQUIRED] MFSN Farm Fresh Map - A few changes needed for your farm listing',
    ],
    [
      farmRemovedEmail('Two Brooks', 'Sam'),
      'MFSN Farm Fresh Map - Your farm has been removed from the map',
    ],
    [
      verificationEmail('https://verify.test'),
      'Verify Your Email for the Mississippi Farm Fresh Map',
    ],
  ])('uses the design subject %#', ({ subject }, expected) => {
    expect(subject).toBe(expected);
  });

  test('greets farmers without a name', () => {
    expect(text(changesRequestedEmail('Two Brooks', null, 'x').template)).toContain('Hi there,');
    expect(text(farmApprovedEmail('Two Brooks', ' ').template)).toContain('Hi there,');
  });

  test('links an approved farmer to a page that exists', () => {
    expect(farmApprovedEmail('Two Brooks', 'Sam').template.ctaUrl).toMatch(/\/farmer\/farms$/);
  });

  test('uses the full name, then the email, for owners', () => {
    expect(ownerDisplayName({ ...owner, firstName: 'Sam', lastName: 'Lee' })).toBe('Sam Lee');
    expect(ownerDisplayName(owner)).toBe('owner@example.com');
  });

  test('finds owners who only exist in Firebase Auth', async () => {
    const userService = {
      getUserByFirebaseUid: jest.fn().mockRejectedValue(new Error('missing')),
    } as unknown as IUserService;
    mockGetAuthUser.mockResolvedValueOnce({ email: 'auth@example.com', displayName: 'Sam Lee' });

    await expect(findFarmOwner(userService, 'owner-1')).resolves.toEqual({
      email: 'auth@example.com',
      firstName: 'Sam',
      lastName: 'Lee',
    });
  });

  test('matches the edit request design', () => {
    const { template } = editRequestEmail('Two Brooks', 'Sam Lee');

    expect(template.ctaText).toBe('Review edit request');
    expect(template.reasonText).toBeUndefined();
  });

  test('still sends the admin email when the owner lookup fails', async () => {
    const userService = {
      getUserByFirebaseUid: jest.fn().mockRejectedValue(new Error('missing')),
    } as unknown as IUserService;
    mockGetAuthUser.mockRejectedValueOnce(new Error('no auth user'));

    const ownerName = await findOwnerName(userService, 'owner-1');

    expect(ownerName).toBeUndefined();
    expect(text(deletionRequestEmail('Two Brooks', ownerName).template)).toContain('A farmer');
  });
});

describe('EmailLayout', () => {
  test('renders the farmer footer with the contact form and no placeholder link', async () => {
    const output = await html(farmRemovedEmail('Two Brooks', 'Sam').template);

    expect(output).toContain('https://www.mississippifarmtoschool.org/contact');
    expect(output).toContain('Mississippi Farm to School Network');
    expect(output).not.toContain('yourmaplink.com');
  });

  test('renders the admin footer with the support email', async () => {
    const output = await html(newFarmEmail('Two Brooks').template);

    expect(output).toContain('mailto:info@uwblueprint.org');
    expect(output).not.toContain('registered farmer');
  });

  test('places the reason box before the closing copy and the button', async () => {
    const output = await html(changesRequestedEmail('Two Brooks', 'Sam', 'REASON-TEXT').template);

    expect(output.indexOf('REASON-TEXT')).toBeLessThan(output.indexOf('Log back into'));
    expect(output.indexOf('Log back into')).toBeLessThan(output.indexOf('Update my farm'));
  });

  test('escapes HTML in farm-supplied text', async () => {
    const output = await html(farmRemovedEmail('<img src=x onerror=alert(1)>', 'Sam').template);

    expect(output).not.toContain('<img src=x');
  });
});
