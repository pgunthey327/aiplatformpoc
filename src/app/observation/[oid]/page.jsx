"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { formatMessages } from "@/lib/traceUtils";

export default function Page() {
  const { oid } = useParams();
  const router = useRouter();

  const [observation, setObservation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!oid) return;

    const getData = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(
          `/api/getObservation/${oid}`
        );

        const result = await res.json();

        if (!res.ok) {
          setError(
            result.message || "Observation not found"
          );
          setObservation(null);
          return;
        }

        setObservation(result.data);
      } catch (err) {
        console.error(err);

        setError("Something went wrong");
        setObservation(null);
      } finally {
        setLoading(false);
      }
    };

    getData();
  }, [oid]);

  if (error && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="w-full max-w-xl">
          <CardHeader>
            <CardTitle className="text-center text-2xl">
              Observation Not Found
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="text-center text-muted-foreground">
              {error}
            </div>

            <div className="border rounded-lg p-4">
              <p className="font-medium mb-2">
                Observation ID
              </p>

              <p className="break-all text-muted-foreground">
                {oid}
              </p>
            </div>

            <div className="flex justify-center gap-3">
              <Button
                variant="outline"
                onClick={() => router.back()}
              >
                ← Go Back
              </Button>

              <Button
                onClick={() =>
                  router.push("/dashboard")
                }
              >
                Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-full h-screen">
        <div className="flex h-full justify-center items-center">
          <Spinner />
        </div>
      </div>
    );
  }



  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <Button
                variant="outline"
                onClick={() => router.back()}
              >
                ← Back
              </Button>

              <div className="flex gap-2">
                <Badge>{observation.type}</Badge>
                <Badge variant="secondary">
                  {observation.environment}
                </Badge>
              </div>
            </div>

            <div>
              <CardTitle className="text-2xl">
                {observation.name}
              </CardTitle>

              <p className="text-sm text-muted-foreground mt-2 break-all">
                Observation ID: {observation.id}
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* General Info */}
      <Card>
        <CardHeader>
          <CardTitle>General Information</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <Info label="Trace ID" value={observation.traceId} />
            <Info label="Model" value={observation.model} />
            <Info label="Level" value={observation.level} />
            <Info label="Latency" value={`${observation.latency}s`} />

            <Info
              label="Start Time"
              value={
                observation.startTime
                  ? new Date(
                    observation.startTime
                  ).toLocaleString()
                  : "-"
              }
            />

            <Info
              label="End Time"
              value={
                observation.endTime
                  ? new Date(
                    observation.endTime
                  ).toLocaleString()
                  : "-"
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Prompt */}
      <Card>
        <CardHeader>
          <CardTitle>Input Prompt</CardTitle>
        </CardHeader>

        <CardContent>
          <pre className="whitespace-pre-wrap break-words rounded-md bg-muted p-4 text-sm">
            {formatMessages(observation.input) || "No input available"}
          </pre>
        </CardContent>
      </Card>

      {/* Response */}
      <Card>
        <CardHeader>
          <CardTitle>Model Response</CardTitle>
        </CardHeader>

        <CardContent>
          <pre className="whitespace-pre-wrap break-words rounded-md bg-muted p-4 text-sm">
            {formatMessages(observation.output) || "No output available"}
          </pre>
        </CardContent>
      </Card>

      {/* Token Usage */}
      <Card>
        <CardHeader>
          <CardTitle>Token Usage</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <Metric
              title="Input Tokens"
              value={observation.promptTokens ?? 0}
            />

            <Metric
              title="Output Tokens"
              value={observation.completionTokens ?? 0}
            />

            <Metric
              title="Total Tokens"
              value={observation.totalTokens ?? 0}
            />
          </div>
        </CardContent>
      </Card>

      {/* Cost Details */}
      <Card>
        <CardHeader>
          <CardTitle>Cost Details</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <Metric
              title="Input Cost"
              value={`$${observation.calculatedInputCost ?? 0}`}
            />

            <Metric
              title="Output Cost"
              value={`$${observation.calculatedOutputCost ?? 0}`}
            />

            <Metric
              title="Total Cost"
              value={`$${observation.calculatedTotalCost ?? 0}`}
            />
          </div>
        </CardContent>
      </Card>

      {/* Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>Metadata</CardTitle>
        </CardHeader>

        <CardContent>
          <pre className="bg-muted p-4 rounded-md overflow-auto text-sm">
            {JSON.stringify(
              observation.metadata || {},
              null,
              2
            )}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <p className="text-muted-foreground text-xs mb-1">
        {label}
      </p>

      <p className="font-medium break-all">
        {value || "-"}
      </p>
    </div>
  );
}

function Metric({ title, value }) {
  return (
    <div className="border rounded-lg p-4">
      <p className="text-muted-foreground text-sm">
        {title}
      </p>

      <Separator className="my-2" />

      <p className="text-2xl font-bold">
        {value}
      </p>
    </div>
  );
}