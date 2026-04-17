import { PostPurchaseWatchScreen } from "@/components/vehicle/PostPurchaseWatchScreen";

type Props = {
  params: { plate: string };
};

export default function PostPurchaseWatchPage({ params }: Props) {
  return <PostPurchaseWatchScreen plate={params.plate} />;
}
