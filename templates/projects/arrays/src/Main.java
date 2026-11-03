public class Main {
    public static void main(String[] args) {
        int[] numeros = {10, 20, 30, 40};

        System.out.println(numeros[0]);
        numeros[1] = 25;

        for (int i = 0; i < numeros.length; i++) {
            System.out.println("Posición " + i + ": " + numeros[i]);
        }
    }
}
