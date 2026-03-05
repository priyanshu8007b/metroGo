'use server';
/**
 * @fileOverview An AI agent that interprets textual descriptions of metro networks
 * to generate a structured graph representation.
 *
 * - aiNetworkConstructor - A function that handles the AI network construction process.
 * - AiNetworkConstructorInput - The input type for the aiNetworkConstructor function.
 * - AiNetworkConstructorOutput - The return type for the aiNetworkConstructor function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AiNetworkConstructorInputSchema = z.object({
  description: z
    .string()
    .describe(
      'A textual description of the metro network, including stations, connections, and travel times.'
    ),
});
export type AiNetworkConstructorInput = z.infer<
  typeof AiNetworkConstructorInputSchema
>;

const StationConnectionSchema = z.object({
  station: z.string().describe('The name of the connected station.'),
  time: z
    .number()
    .int()
    .describe('The travel time in minutes to the connected station.'),
});

const AiNetworkConstructorOutputSchema = z
  .record(
    z.string().describe('The name of the station (vertex).'),
    z.array(StationConnectionSchema).describe('An array of connections from this station.')
  )
  .describe(
    'A JSON object representing the metro network as an adjacency list, where keys are station names and values are arrays of connected stations with their travel times.'
  );
export type AiNetworkConstructorOutput = z.infer<
  typeof AiNetworkConstructorOutputSchema
>;

export async function aiNetworkConstructor(
  input: AiNetworkConstructorInput
): Promise<AiNetworkConstructorOutput> {
  return aiNetworkConstructorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiNetworkConstructorPrompt',
  input: { schema: AiNetworkConstructorInputSchema },
  output: { schema: AiNetworkConstructorOutputSchema },
  prompt: `You are an AI assistant designed to construct metro network graphs from textual descriptions.

Given a description of metro lines, stations, and travel times, your task is to parse this information and output a JSON representation of the metro network as an adjacency list.

The network is an undirected graph, meaning if there's a connection from Station A to Station B with a certain travel time, there must also be an explicit entry for Station B connecting back to Station A with the same travel time.

For each station, list its direct connections, including the connected station's name and the travel time in minutes.

Input Description:
{{{description}}}

Strictly adhere to the following JSON schema for your output:
`,
});

const aiNetworkConstructorFlow = ai.defineFlow(
  {
    name: 'aiNetworkConstructorFlow',
    inputSchema: AiNetworkConstructorInputSchema,
    outputSchema: AiNetworkConstructorOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
