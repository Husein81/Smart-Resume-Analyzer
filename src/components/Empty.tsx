import Link from "next/link";
import Icon from "./icon";
import { Button, Shad } from "./ui";

type Props = {
  title: string;
  icon?: string;
  description?: string;
  backTo?: string;
};
const Empty = ({ title, icon, description, backTo }: Props) => {
  return (
    <Shad.Empty>
      <Shad.EmptyHeader>
        {icon && (
          <Shad.EmptyMedia className="size-16 rounded-full mx-auto bg-muted flex items-center justify-center">
            <Icon name={icon} className="w-8 h-8 text-muted-foreground" />
          </Shad.EmptyMedia>
        )}
        <Shad.EmptyTitle>
          <span className="text-2xl font-bold mb-2">{title}</span>
        </Shad.EmptyTitle>
        {description && (
          <Shad.EmptyDescription className="text-muted-foreground mb-4">
            {description}
          </Shad.EmptyDescription>
        )}
      </Shad.EmptyHeader>
      <Shad.EmptyContent>
        {backTo && (
          <Button asChild>
            <Link href={backTo} className="capitalize">
              <Icon name="ArrowLeft" className="w-4 h-4 mr-2" />
              Go Back to {backTo.replace("/", "")}
            </Link>
          </Button>
        )}
      </Shad.EmptyContent>
    </Shad.Empty>
  );
};
export default Empty;
