import React, { ReactNode } from "react";
import * as Popover from "@radix-ui/react-popover";

const PopoverWrapper = ({
  title,
  content
}: {
  title: ReactNode;
  content: ReactNode;
}) => {
  return (
    <Popover.Root>
      <Popover.Trigger className="cursor-pointer" asChild>
        {title}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className="bg-white rounded shadow-[hsl(206_22%_7%_/_35%)_0px_10px_38px_-10px,hsl(206_22%_7%_/_20%)_0px_10px_20px_-15px] select-none will-change-[transform,opacity] px-2 py-2.5 focus-visible:outline-0"
          sideOffset={5}
        >
          {content}
          <Popover.Arrow className="fill-white" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
};

export default PopoverWrapper;
