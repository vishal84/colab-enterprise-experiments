import { GoogleAuth } from 'google-auth-library';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { query, filter } = await req.json();

    const projectId = process.env.NEXT_PUBLIC_PROJECT_ID || 'gemini-ent-agent-demos';
    const location = process.env.NEXT_PUBLIC_LOCATION || 'global';
    const engineId = process.env.NEXT_PUBLIC_ENGINE_ID;
    
    if (!engineId || engineId === "YOUR_ENGINE_ID") {
      return NextResponse.json({ error: "Please configure NEXT_PUBLIC_ENGINE_ID in .env.local to point to your Search App." }, { status: 500 });
    }

    // This handles local Google Cloud credentials automatically 
    // Requires running 'gcloud auth application-default login'
    const auth = new GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/cloud-platform']
    });

    let accessToken;
    try {
        accessToken = await auth.getAccessToken();
    } catch(e) {
        return NextResponse.json({ error: "Could not get GCP Credentials. Please run 'gcloud auth application-default login'" }, { status: 500 });
    }
    
    const baseUrl = location !== 'global' ? `https://${location}-discoveryengine.googleapis.com` : 'https://discoveryengine.googleapis.com';
    const url = `${baseUrl}/v1alpha/projects/${projectId}/locations/${location}/collections/default_collection/engines/${engineId}/servingConfigs/default_serving_config:answer`;

    const payload: any = {
      query: { text: query },
      answerGenerationSpec: {
        includeCitations: true,
        multimodalSpec: { imageSource: "CORPUS_IMAGE_ONLY" },
        modelSpec: { modelVersion: "stable" }
      }
    };

    if (filter) {
        payload.sessionSpec = {
             searchParams: {
                 filter: filter
             }
        };
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errText = await response.text();
        console.error("Discovery Engine Error:", errText);
        return NextResponse.json({ error: errText }, { status: response.status });
    }

    const data = await response.json();
    
    // Debug: log the answer structure to verify citations format
    if (data.answer) {
      console.log("=== Answer API Response ===");
      console.log("Citations:", JSON.stringify(data.answer.citations, null, 2));
      console.log("References count:", data.answer.references?.length);
      if (data.answer.references?.[0]) {
        console.log("First reference sample:", JSON.stringify(data.answer.references[0], null, 2).substring(0, 500));
      }
    }
    
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("API Route Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
