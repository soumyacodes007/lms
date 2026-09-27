import { error } from '@sveltejs/kit';
import { classroomio, getApiHeaders } from '$lib/utils/services/api';

export const load = async ({ params, cookies }) => {
  const response = await classroomio.ncct.credentials.verify[':verificationToken'].$get(
    { param: { verificationToken: params.verificationToken } },
    getApiHeaders(cookies)
  );

  if (!response.ok) throw error(404, 'Credential not found');

  return { credential: response.body.data };
};
