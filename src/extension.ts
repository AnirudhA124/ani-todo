// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { HelloWorldPanel } from './HelloWorldPanel';

export function activate(context: vscode.ExtensionContext) {

	console.log('Congratulations, your extension "ani-todo" is now active!');
	
	context.subscriptions.push(vscode.commands.registerCommand('ani-todo.helloWorld',  () => {
		HelloWorldPanel.createOrShow(context.extensionUri);
	}));

	context.subscriptions.push(vscode.commands.registerCommand('ani-todo.askQuestion', async ()=>{
		const answer = await vscode.window.showInformationMessage('How was Your Day?','Good','Bad');
		if (answer==="Bad"){
			vscode.window.showInformationMessage("Sorry to here.");
		}else{
			console.log(answer);
		}
	}));

	context.subscriptions.push(vscode.commands.registerCommand('ani-todo.refresh',()=>{
		HelloWorldPanel.kill();
		HelloWorldPanel.createOrShow(context.extensionUri);
		
	}));
}

export function deactivate() { }
