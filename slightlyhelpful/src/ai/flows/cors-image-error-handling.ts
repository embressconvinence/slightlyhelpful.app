'use server';

/**
 * @fileOverview Checks the URL for CORS policy and displays a friendly error message if an image fails to load due to CORS restrictions.
 *
 * - checkCorsAndGetErrorMessage - A function that checks the URL for CORS policy.
 * - CheckCorsInput - The input type for the checkCorsAndGetErrorMessage function.
 * - CheckCorsOutput - The return type for the checkCorsAndGetErrorMessage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CheckCorsInputSchema = z.object({
  imageUrl: z.string().describe('The URL of the image to check for CORS.'),
});
export type CheckCorsInput = z.infer<typeof CheckCorsInputSchema>;

const CheckCorsOutputSchema = z.object({
  errorMessage: z
    .string()
    .describe(
      'A user-friendly error message if a CORS error is detected; otherwise, an empty string.'
    ),
});
export type CheckCorsOutput = z.infer<typeof CheckCorsOutputSchema>;

export async function checkCorsAndGetErrorMessage(
  input: CheckCorsInput
): Promise<CheckCorsOutput> {
  return checkCorsFlow(input);
}

const checkCorsPrompt = ai.definePrompt({
  name: 'checkCorsPrompt',
  input: {schema: CheckCorsInputSchema},
  output: {schema: CheckCorsOutputSchema},
  prompt: `You are an expert web developer. Your task is to determine if a given image URL is likely to cause a CORS error when loaded in a browser.

  Consider the following factors when determining if a CORS error is likely:

  *   **Origin Mismatch:** The image URL's origin (protocol, domain, and port) is different from the origin of the web page trying to load the image.
  *   **Missing or Restrictive CORS Headers:** The server hosting the image does not include the necessary CORS headers in its response (e.g., Access-Control-Allow-Origin).
  *   **HTTPS/HTTP Mismatch:** The image is served over HTTP, while the web page is served over HTTPS, or vice versa.
  *   **Authentication Issues:** The image requires authentication (e.g., cookies or API keys) that are not being correctly passed in the request.

  Based on these factors, analyze the following image URL and determine if it is likely to cause a CORS error. If a CORS error is likely return an error message that explains the situation to the end user.

  If a CORS error is unlikely, return an empty string.

  Image URL: {{{imageUrl}}}
  `,
});

const checkCorsFlow = ai.defineFlow(
  {
    name: 'checkCorsFlow',
    inputSchema: CheckCorsInputSchema,
    outputSchema: CheckCorsOutputSchema,
  },
  async input => {
    const {output} = await checkCorsPrompt(input);
    return output!;
  }
);
