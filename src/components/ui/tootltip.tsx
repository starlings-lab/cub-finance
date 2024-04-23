import React, { ReactNode } from "react";
import * as Tooltip from "@radix-ui/react-tooltip";

const TooltipWrapper = ({
  title,
  content
}: {
  title: ReactNode;
  content: ReactNode;
}) => {
  return (
    <Tooltip.Provider>
      <Tooltip.Root>
        <Tooltip.Trigger className="cursor-pointer" asChild>{title}</Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content className="bg-white rounded shadow-[hsl(206_22%_7%_/_35%)_0px_10px_38px_-10px,hsl(206_22%_7%_/_20%)_0px_10px_20px_-15px] select-none will-change-[transform,opacity] px-2 py-2.5" sideOffset={5}>
            {content}
            <Tooltip.Arrow className="fill-white" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
};

export default TooltipWrapper;
