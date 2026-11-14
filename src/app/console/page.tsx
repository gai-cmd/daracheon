import ConsoleApp from './ConsoleApp';

// Server shell only: no item, people or audit data is rendered into the HTML (REQ-CON-009).
// The client fetches everything from the authenticated console API after sign-in.
export default function ConsolePage() {
  return <ConsoleApp />;
}
