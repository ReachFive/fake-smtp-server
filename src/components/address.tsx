import type { AddressObject } from "mailparser";

const Address = ({
  address,
  ...props
}: React.ComponentProps<"span"> & {
  address?: AddressObject | AddressObject[];
}) => {
  if (!address) {
    return null;
  }

  if (Array.isArray(address)) {
    return (
      <span {...props}>
        {address.map((a) => (
          <Address key={a.text} address={a} />
        ))}
      </span>
    );
  }

  return (
    <>
      {address.value.map((value) => (
        <span key={value.name}>
          <span className="font-semibold">{value.name} </span>
          <span className="text-muted-foreground text-sm">
            &lt;{value.address}&gt;
          </span>
        </span>
      ))}
    </>
  );
};

export { Address };
