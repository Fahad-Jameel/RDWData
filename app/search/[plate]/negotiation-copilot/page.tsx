import { NegotiationCopilotScreen } from "@/components/vehicle/NegotiationCopilotScreen";

type Props = {
  params: { plate: string };
};

export default function NegotiationCopilotPage({ params }: Props) {
  return <NegotiationCopilotScreen plate={params.plate} />;
}
