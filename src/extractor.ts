import * as ts from 'typescript';
import * as fs from 'fs';

interface Message {
  id: string;
  defaultMessage: string;
  description?: string;
  file: string;
  line: number;
}

export function extractMessages(files: string[]): Message[] {
  const messages: Message[] = [];
  
  for (const file of files) {
    const source = fs.readFileSync(file, 'utf-8');
    const sourceFile = ts.createSourceFile(
      file,
      source,
      ts.ScriptTarget.Latest,
      true
    );

    const visit = (node: ts.Node) => {
      if (ts.isCallExpression(node) && 
          ts.isIdentifier(node.expression) && 
          node.expression.text === 'formatMessage') {
        
        const [firstArg] = node.arguments;
        if (ts.isStringLiteral(firstArg) || ts.isNoSubstitutionTemplateLiteral(firstArg)) {
          messages.push({
            id: firstArg.text,
            defaultMessage: firstArg.text,
            file,
            line: sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1
          });
        } else if (ts.isObjectLiteralExpression(firstArg)) {
          const msg: Partial<Message> = { file, line: sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1 };
          for (const prop of firstArg.properties) {
            if (ts.isPropertyAssignment(prop)) {
              const name = prop.name.getText();
              const value = prop.initializer;
              if (name === 'id' && ts.isStringLiteral(value)) {
                msg.id = value.text;
              } else if (name === 'default' && ts.isStringLiteral(value)) {
                msg.defaultMessage = value.text;
              } else if (name === 'description' && ts.isStringLiteral(value)) {
                msg.description = value.text;
              }
            }
          }
          if (msg.defaultMessage) {
            messages.push(msg as Message);
          }
        }
      }
      
      ts.forEachChild(node, visit);
    }
    
    visit(sourceFile);
  }
  
  return messages;
}
