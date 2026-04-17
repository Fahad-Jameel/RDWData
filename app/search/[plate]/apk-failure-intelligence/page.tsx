import { ApkFailureIntelligenceScreen } from "@/components/vehicle/ApkFailureIntelligenceScreen";

type Props = {
  params: { plate: string };
};

export default function ApkFailureIntelligencePage({ params }: Props) {
  return <ApkFailureIntelligenceScreen plate={params.plate} />;
}
